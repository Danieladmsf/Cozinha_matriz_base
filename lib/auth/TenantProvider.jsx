'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import {
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { setTenantId, clearTenantId } from '@/lib/auth/tenantStore';

// ============================================
// CONTEXT
// ============================================
const TenantContext = createContext(null);

/**
 * Hook para acessar dados do tenant e usuário
 * @returns {{ tenantId, user, loading, signInWithGoogle, signOut, isTrialExpired }}
 */
export function useTenant() {
    const context = useContext(TenantContext);
    if (!context) {
        throw new Error('useTenant() deve ser usado dentro de <TenantProvider>');
    }
    return context;
}

// ============================================
// PROVIDER
// ============================================

const googleProvider = new GoogleAuthProvider();

/**
 * TenantProvider — Gerencia autenticação e contexto de tenant
 * 
 * Fluxo:
 * 1. Observa Firebase Auth (onAuthStateChanged)
 * 2. Quando usuário loga com Google:
 *    a. Busca User/{uid} no Firestore
 *    b. Se não existe → PRIMEIRO LOGIN → cria tenant + documento User
 *    c. Se existe → carrega tenantId
 * 3. Seta tenantId global via tenantStore
 * 4. Disponibiliza tudo via Context
 */
export default function TenantProvider({ children, publicRoutes = [] }) {
    const [user, setUser] = useState(null);
    const [tenantData, setTenantData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [initializing, setInitializing] = useState(false);

    // ---- Resolver dados do tenant a partir do UID ----
    const resolveUserTenant = useCallback(async (firebaseUser) => {
        try {
            const userDocRef = doc(db, 'User', firebaseUser.uid);
            const userSnap = await getDoc(userDocRef);

            if (userSnap.exists()) {
                // ✅ Usuário já existe — carregar tenant
                const userData = userSnap.data();
                console.log('[TenantProvider] Usuário encontrado:', userData.email, '→ tenant:', userData.tenantId);
                return userData;
            } else {
                // 🆕 PRIMEIRO LOGIN — criar tenant
                console.log('[TenantProvider] Primeiro login! Criando tenant para:', firebaseUser.email);
                setInitializing(true);

                const newTenantId = `tenant_${firebaseUser.uid}`;
                const now = new Date();
                const trialEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 dias

                const newUserData = {
                    tenantId: newTenantId,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName || '',
                    photoURL: firebaseUser.photoURL || '',
                    plan: 'trial',
                    trialEndsAt: trialEndsAt,
                    createdAt: now,
                    updatedAt: now
                };

                await setDoc(userDocRef, newUserData);

                // Criar documento do tenant (metadata)
                const tenantDocRef = doc(db, 'tenants', newTenantId);
                await setDoc(tenantDocRef, {
                    ownerId: firebaseUser.uid,
                    ownerEmail: firebaseUser.email,
                    ownerName: firebaseUser.displayName || '',
                    plan: 'trial',
                    trialEndsAt: trialEndsAt,
                    createdAt: now
                });

                // 🔥 Semear tipos de categorias padrão para o novo cliente ter os menus principais
                const defaultCategoryTypes = [
                    { value: 'ingredient', label: 'Insumos', order: 1, is_system: true },
                    { value: 'recipe', label: 'Receitas', order: 2, is_system: true },
                    { value: 'product', label: 'Produtos SKU', order: 3, is_system: true }
                ];

                try {
                    for (const catType of defaultCategoryTypes) {
                        const newTypeRef = doc(collection(db, `tenants/${newTenantId}/CategoryType`));
                        await setDoc(newTypeRef, {
                            id: newTypeRef.id,
                            value: catType.value,
                            label: catType.label,
                            order: catType.order,
                            is_system: catType.is_system,
                            createdAt: now,
                            updatedAt: now
                        });
                    }
                    console.log('[TenantProvider] Tipos de categorias default criados.');
                } catch (seedErr) {
                    console.error('[TenantProvider] Erro ao semear categorias:', seedErr);
                }

                console.log('[TenantProvider] ✅ Tenant criado:', newTenantId);
                setInitializing(false);
                return newUserData;
            }
        } catch (error) {
            console.error('[TenantProvider] Erro ao resolver tenant:', error);
            setInitializing(false);
            throw error;
        }
    }, []);

    // ---- Observar estado de autenticação ----
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const userData = await resolveUserTenant(firebaseUser);
                    setUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName,
                        photoURL: firebaseUser.photoURL
                    });
                    setTenantData(userData);

                    // 🔑 Setar tenantId global para entities.js e chamadas diretas
                    setTenantId(userData.tenantId);
                    console.log('[TenantProvider] TenantId global setado:', userData.tenantId);
                } catch (error) {
                    console.error('[TenantProvider] Erro na resolução do auth:', error);
                    setUser(null);
                    setTenantData(null);
                    clearTenantId();
                }
            } else {
                // Não logado
                setUser(null);
                setTenantData(null);
                clearTenantId();
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [resolveUserTenant]);

    // ---- Ações ----
    const signInWithGoogle = useCallback(async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            return result.user;
        } catch (error) {
            console.error('[TenantProvider] Erro no login Google:', error);
            throw error;
        }
    }, []);

    const signOut = useCallback(async () => {
        try {
            clearTenantId();
            await firebaseSignOut(auth);
            setUser(null);
            setTenantData(null);
        } catch (error) {
            console.error('[TenantProvider] Erro no logout:', error);
        }
    }, []);

    // ---- Trial check ----
    const isTrialExpired = tenantData?.plan === 'trial' &&
        tenantData?.trialEndsAt &&
        new Date() > new Date(tenantData.trialEndsAt?.seconds ? tenantData.trialEndsAt.seconds * 1000 : tenantData.trialEndsAt);

    // ---- Context value ----
    const value = {
        tenantId: tenantData?.tenantId || null,
        user,
        tenantData,
        loading,
        initializing,
        signInWithGoogle,
        signOut,
        isTrialExpired
    };

    return (
        <TenantContext.Provider value={value}>
            {children}
        </TenantContext.Provider>
    );
}
