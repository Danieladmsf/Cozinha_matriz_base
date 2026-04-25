import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getTenantIdFromRequest } from '@/lib/auth/tenantStore';

export const runtime = 'nodejs';

function normalizeCnpj(cnpj) {
    return String(cnpj || '').replace(/\D/g, '');
}

function generateSupplierCode(companyName, existingCodes) {
    if (!companyName) return '';
    const prefix = companyName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 3);
    let max = 0;
    existingCodes.forEach((code) => {
        const m = String(code || '').match(/\d+/);
        if (m) {
            const n = parseInt(m[0], 10);
            if (n > max) max = n;
        }
    });
    return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

export async function POST(request) {
    const tenantId = getTenantIdFromRequest(request);
    if (!tenantId) {
        return NextResponse.json({ error: 'tenantId ausente' }, { status: 401 });
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
    }

    const cnpjDigits = normalizeCnpj(body?.cnpj);
    if (!cnpjDigits) {
        return NextResponse.json({ error: 'CNPJ obrigatório' }, { status: 400 });
    }
    if (!body?.company_name) {
        return NextResponse.json({ error: 'Razão social obrigatória' }, { status: 400 });
    }

    const supplierCol = adminDb.collection(`tenants/${tenantId}/Supplier`);
    const all = await supplierCol.get();

    const dup = all.docs.find((d) => normalizeCnpj(d.data()?.cnpj) === cnpjDigits);
    if (dup) {
        return NextResponse.json(
            { error: 'Fornecedor com este CNPJ já existe', supplierId: dup.id },
            { status: 409 }
        );
    }

    const existingCodes = all.docs.map((d) => d.data()?.supplier_code).filter(Boolean);
    const code = body.supplier_code || generateSupplierCode(body.company_name, existingCodes);

    const ref = supplierCol.doc();
    const data = {
        company_name: body.company_name,
        cnpj: body.cnpj,
        supplier_code: code,
        vendor_name: body.vendor_name || '',
        vendor_phone: body.vendor_phone || '',
        email: body.email || '',
        address: body.address || '',
        vendor_photo: body.vendor_photo || '',
        notes: body.notes || '',
        active: true,
        criadoVia: 'nfe',
        createdAt: new Date().toISOString(),
    };

    await ref.set(data);
    return NextResponse.json({ id: ref.id, ...data }, { status: 201 });
}
