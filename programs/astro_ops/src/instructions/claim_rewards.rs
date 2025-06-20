use anchor_lang::prelude::*;
use crate::{state::Ship, errors::ErrorCode};

pub fn handler(ctx: Context<ClaimRewards>) -> Result<()> {
    let ship = &mut ctx.accounts.ship;

    // Only owner may claim
    if ship.owner != *ctx.accounts.user.key {
        return err!(ErrorCode::Unauthorized);
    }

    // TODO:
    // - calculate accumulated AT rewards since last claim  
    // - transfer AT tokens to user’s account  
    // - reset any reward counters / timestamps  

    Ok(())
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(mut, has_one = owner @ ErrorCode::Unauthorized)]
    pub ship: Account<'info, Ship>,

    #[account(mut)]
    pub user: Signer<'info>,

    // Token accounts and program to credit AT
    // pub token_program: Program<'info, Token>,
    // #[account(mut)]
    // pub ship_at_account: Account<'info, TokenAccount>,
    // #[account(mut)]
    // pub user_at_account: Account<'info, TokenAccount>,
}
