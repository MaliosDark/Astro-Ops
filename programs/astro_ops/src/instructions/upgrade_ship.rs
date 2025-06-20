use anchor_lang::prelude::*;
use crate::{state::Ship, errors::ErrorCode};

pub fn handler(ctx: Context<UpgradeShip>, new_level: u8) -> Result<()> {
    let ship = &mut ctx.accounts.ship;
    let user = &mut ctx.accounts.user;

    // Only owner may upgrade
    if ship.owner != *user.key {
        return err!(ErrorCode::Unauthorized);
    }

    // Prevent invalid levels
    if new_level <= ship.level || new_level > 7 {
        return err!(ErrorCode::InsufficientFunds);
    }

    // TODO:
    // - calculate cost based on ship.level  
    // - transfer AT tokens from user to treasury  
    // - apply any cooldown or delay on upgrade  

    ship.level = new_level;
    Ok(())
}

#[derive(Accounts)]
pub struct UpgradeShip<'info> {
    #[account(mut, has_one = owner @ ErrorCode::Unauthorized)]
    pub ship: Account<'info, Ship>,

    #[account(mut)]
    pub user: Signer<'info>,

    // Token accounts and program to debit AT
    // pub token_program: Program<'info, Token>,
    // #[account(mut)]
    // pub user_at_account: Account<'info, TokenAccount>,
    // #[account(mut)]
    // pub treasury_at_account: Account<'info, TokenAccount>,
}
