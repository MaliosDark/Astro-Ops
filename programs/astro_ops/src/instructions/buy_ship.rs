use anchor_lang::prelude::*;
use crate::state::Ship;

pub fn handler(ctx: Context<BuyShip>) -> Result<()> {
    let ship = &mut ctx.accounts.ship;
    ship.owner = *ctx.accounts.user.key;
    ship.level = 1;
    ship.last_mission = 0;
    // TODO: transfer 15 USDC from user to treasury via Token Program
    Ok(())
}

#[derive(Accounts)]
pub struct BuyShip<'info> {
    #[account(init, payer = user, space = Ship::LEN)]
    pub ship: Account<'info, Ship>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
    // add TokenProgram, USDC Mint, Token Accounts...
}
