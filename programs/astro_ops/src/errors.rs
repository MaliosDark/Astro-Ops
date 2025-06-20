use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Cooldown active")]
    CooldownActive,
    #[msg("Insufficient funds")]
    InsufficientFunds,
    #[msg("Unauthorized")]
    Unauthorized,
}
