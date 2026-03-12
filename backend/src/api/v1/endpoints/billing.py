from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from src.database import get_db
from src.models.billing import PaymentFee, Agreement, ServiceAgreementPrice
from src.schemas.billing import (
    PaymentFeeCreate, PaymentFeeResponse, PaymentFeeUpdate,
    AgreementCreate, AgreementResponse, AgreementUpdate,
    AgreementPricesUpdate, AgreementPriceResponse
)

router = APIRouter()

# --- ROTAS DE TAXAS DE PAGAMENTO (Mantidas intactas) ---
@router.get("/fees", response_model=List[PaymentFeeResponse])
def get_payment_fees(tenant_id: UUID, db: Session = Depends(get_db)):
    return db.query(PaymentFee).filter(PaymentFee.tenant_id == tenant_id).all()

@router.post("/fees", response_model=PaymentFeeResponse)
def create_payment_fee(fee: PaymentFeeCreate, db: Session = Depends(get_db)):
    existing = db.query(PaymentFee).filter(PaymentFee.tenant_id == fee.tenant_id, PaymentFee.metodo_pagamento == fee.metodo_pagamento).first()
    if existing: raise HTTPException(status_code=400, detail="Já existe uma regra para este método.")
    db_fee = PaymentFee(**fee.model_dump() if hasattr(fee, 'model_dump') else fee.dict())
    db.add(db_fee)
    db.commit()
    db.refresh(db_fee)
    return db_fee

@router.put("/fees/{fee_id}", response_model=PaymentFeeResponse)
def update_payment_fee(fee_id: UUID, fee: PaymentFeeUpdate, db: Session = Depends(get_db)):
    db_fee = db.query(PaymentFee).filter(PaymentFee.id == fee_id).first()
    if not db_fee: raise HTTPException(status_code=404, detail="Taxa não encontrada")
    update_data = fee.model_dump(exclude_unset=True) if hasattr(fee, 'model_dump') else fee.dict(exclude_unset=True)
    for key, value in update_data.items(): setattr(db_fee, key, value)
    db.commit()
    db.refresh(db_fee)
    return db_fee

@router.delete("/fees/{fee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_payment_fee(fee_id: UUID, db: Session = Depends(get_db)):
    db_fee = db.query(PaymentFee).filter(PaymentFee.id == fee_id).first()
    if db_fee:
        db.delete(db_fee)
        db.commit()
    return None

# --- ROTAS DE PARCERIAS / CONVÊNIOS ---
@router.get("/agreements", response_model=List[AgreementResponse])
def get_agreements(tenant_id: UUID, db: Session = Depends(get_db)):
    return db.query(Agreement).filter(Agreement.tenant_id == tenant_id).order_by(Agreement.nome).all()

@router.post("/agreements", response_model=AgreementResponse)
def create_agreement(agreement: AgreementCreate, db: Session = Depends(get_db)):
    db_agreement = Agreement(**agreement.model_dump() if hasattr(agreement, 'model_dump') else agreement.dict())
    db.add(db_agreement)
    db.commit()
    db.refresh(db_agreement)
    return db_agreement

@router.put("/agreements/{agreement_id}", response_model=AgreementResponse)
def update_agreement(agreement_id: UUID, agreement: AgreementUpdate, db: Session = Depends(get_db)):
    db_agreement = db.query(Agreement).filter(Agreement.id == agreement_id).first()
    if not db_agreement: raise HTTPException(status_code=404, detail="Parceria não encontrada")
    update_data = agreement.model_dump(exclude_unset=True) if hasattr(agreement, 'model_dump') else agreement.dict(exclude_unset=True)
    for key, value in update_data.items(): setattr(db_agreement, key, value)
    db.commit()
    db.refresh(db_agreement)
    return db_agreement

@router.delete("/agreements/{agreement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_agreement(agreement_id: UUID, db: Session = Depends(get_db)):
    db_agreement = db.query(Agreement).filter(Agreement.id == agreement_id).first()
    if db_agreement:
        db.delete(db_agreement)
        db.commit()
    return None

# --- 💲 NOVAS ROTAS: TABELA DE PREÇOS ESPECÍFICA ---
@router.get("/agreements/{agreement_id}/prices", response_model=List[AgreementPriceResponse])
def get_agreement_prices(agreement_id: UUID, db: Session = Depends(get_db)):
    return db.query(ServiceAgreementPrice).filter(ServiceAgreementPrice.agreement_id == agreement_id).all()

@router.post("/agreements/{agreement_id}/prices")
def update_agreement_prices(agreement_id: UUID, payload: AgreementPricesUpdate, db: Session = Depends(get_db)):
    # 1. Apaga os preços antigos deste convênio
    db.query(ServiceAgreementPrice).filter(ServiceAgreementPrice.agreement_id == agreement_id).delete()
    
    # 2. Insere os novos preços informados na tela
    for item in payload.prices:
        db_price = ServiceAgreementPrice(
            tenant_id=payload.tenant_id,
            agreement_id=agreement_id,
            service_id=item.service_id,
            valor_acordado=item.valor_acordado
        )
        db.add(db_price)
    
    db.commit()
    return {"status": "ok", "message": "Tabela de preços atualizada"}
