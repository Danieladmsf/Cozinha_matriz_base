import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Order, Customer, Recipe, Product, MenuNote } from "@/app/api/entities";
import { getWeek, getYear, startOfWeek, addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAvailableDays } from '@/hooks/useAvailableDays';
import { APP_CONSTANTS } from '@/lib/constants';

export const useProgramacaoRealtimeData = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState({ initial: true, orders: false });
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [customers, setCustomers] = useState([]);
  const [firebaseRecipes, setFirebaseRecipes] = useState([]);
  const [firebaseProducts, setFirebaseProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [menuNotes, setMenuNotes] = useState([]);

  // Combina receitas e produtos em uma única lista
  const recipes = useMemo(() => {
    return [
      ...firebaseRecipes.map(r => ({ ...r, entityType: 'recipe' })),
      ...firebaseProducts.map(p => ({ ...p, entityType: 'product' }))
    ];
  }, [firebaseRecipes, firebaseProducts]);

  // Hooks e funções auxiliares
  const availableDays = useAvailableDays();

  // Refs para armazenar funções de unsubscribe
  const unsubscribeOrders = useRef(null);
  const unsubscribeCustomers = useRef(null);
  const unsubscribeRecipes = useRef(null);
  const unsubscribeProducts = useRef(null);

  // Para a renderização da interface (TABS), queremos que comece no Domingo (0)
  const uiWeekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 0 }), [currentDate]);

  const weekDays = useMemo(() => {
    // Gerar sempre os 7 dias da semana (Dom a Sáb) para exibição nas abas
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(uiWeekStart, i);
      days.push({
        date,
        dayNumber: i, // 0=Domingo... 6=Sábado
        dayName: format(date, 'EEEE', { locale: ptBR }),
        dayShort: format(date, 'EEE', { locale: ptBR }),
        dayDate: format(date, 'dd/MM', { locale: ptBR }),
        fullDate: format(date, 'dd/MM/yyyy', { locale: ptBR })
      });
    }
    return days;
  }, [uiWeekStart]);

  // ==== ALINHAMENTO COM BANCO DE DADOS (WEEK UTILS) ====
  // Para salvar e consultar Orders e MenuNotes, o sistema inteiro (Cardápio, Cart, Checkout)
  // utiliza weekStartsOn: 1 (Segunda-feira como início).
  // Se usarmos 0 aqui, os dados salvos num Domingo caem na semana "errada" aos olhos do banco.
  const dbWeekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const dbWeekNumber = useMemo(() => getWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const dbYear = useMemo(() => dbWeekStart.getFullYear(), [dbWeekStart]);

  // Setup real-time listeners for customers and recipes (one time, don't change)
  useEffect(() => {
    setLoading(prev => ({ ...prev, initial: true }));
    setConnectionStatus('connecting');

    try {
      // Listen to customers in real-time
      unsubscribeCustomers.current = Customer.listen((customersData, error) => {
        if (error) {
          console.error('Erro ao ouvir customers:', error);
          setConnectionStatus('disconnected');
          return;
        }
        setCustomers(customersData);
      });

      // Listen to recipes in real-time
      unsubscribeRecipes.current = Recipe.listen((recipesData, error) => {
        if (error) {
          console.error('Erro ao ouvir recipes:', error);
          setConnectionStatus('disconnected');
          return;
        }
        setFirebaseRecipes(recipesData);
      });

      // Listen to products in real-time
      unsubscribeProducts.current = Product.listen((productsData, error) => {
        if (error) {
          console.error('Erro ao ouvir products:', error);
          setConnectionStatus('disconnected');
          return;
        }
        setFirebaseProducts(productsData);
      });

      setConnectionStatus('connected');
    } catch (error) {
      console.error('Erro ao configurar listeners:', error);
      setConnectionStatus('disconnected');
    } finally {
      setLoading(prev => ({ ...prev, initial: false }));
    }

    // Cleanup function to unsubscribe when component unmounts
    return () => {
      if (unsubscribeCustomers.current) {
        unsubscribeCustomers.current();
      }
      if (unsubscribeRecipes.current) {
        unsubscribeRecipes.current();
      }
      if (unsubscribeProducts.current) {
        unsubscribeProducts.current();
      }
    };
  }, []); // Empty dependency - setup once

  // Setup real-time listener for orders & notes (changes when week/year changes)
  const unsubscribeMenuNotes = useRef(null);

  useEffect(() => {
    // Cleanup previous listener if exists
    if (unsubscribeOrders.current) {
      unsubscribeOrders.current();
    }
    if (unsubscribeMenuNotes.current) {
      unsubscribeMenuNotes.current();
    }

    setLoading(prev => ({ ...prev, orders: true }));
    setConnectionStatus('syncing');

    try {
      // Listen to orders for current week in real-time
      unsubscribeOrders.current = Order.listen(
        (ordersData, error) => {
          if (error) {
            console.error('Erro ao ouvir orders:', error);
            setConnectionStatus('disconnected');
            setOrders([]);
            setLoading(prev => ({ ...prev, orders: false }));
            return;
          }

          setOrders(ordersData);
          setConnectionStatus('connected');
          setLoading(prev => ({ ...prev, orders: false }));
        },
        [
          { field: 'week_number', operator: '==', value: dbWeekNumber },
          { field: 'year', operator: '==', value: dbYear }
        ]
      );

      // Buscar menu notes para a semana atual
      // Usa list() + filtro client-side (comprovadamente funcional)
      const mockUserId = APP_CONSTANTS.MOCK_USER_ID || 'mock-user-id';
      const weekKey = `${dbYear}-W${dbWeekNumber}`;
      
      MenuNote.list().then(allNotes => {
        const filtered = (allNotes || []).filter(
          n => n.user_id === mockUserId && n.week_key === weekKey
        );
        setMenuNotes(filtered);
      }).catch(err => {
        setMenuNotes([]);
      });

    } catch (error) {
      console.error('Erro ao configurar listener de orders/notes:', error);
      setConnectionStatus('disconnected');
      setOrders([]);
      setMenuNotes([]);
      setLoading(prev => ({ ...prev, orders: false }));
    }

    // Cleanup function
    return () => {
      if (unsubscribeOrders.current) {
        unsubscribeOrders.current();
      }
    };
  }, [dbWeekNumber, dbYear]); // Re-setup when week or year changes

  const navigateWeek = (direction) => {
    setCurrentDate(prev => addDays(prev, direction * 7));
  };

  return {
    currentDate,
    weekDays,
    weekNumber: dbWeekNumber,
    year: dbYear,
    loading,
    connectionStatus,
    customers,
    recipes,
    orders,
    menuNotes,
    navigateWeek,
    // No need for refresh or loadOrdersForWeek - data updates automatically!
  };
};
