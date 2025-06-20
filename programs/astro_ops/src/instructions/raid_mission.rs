use anchor_lang::prelude::*;
use crate::{state::{Ship, Mode}, errors::ErrorCode};

pub fn handler(ctx: Context<RaidMission>, target_ship: Pubkey) -> Result<()> {
    let attacker = &mut ctx.accounts.attacker_ship;
    let clock = Clock::get()?.unix_timestamp;

    // Ensure attacker owns their ship
    if attacker.owner != *ctx.accounts.attacker.key {
        return err!(ErrorCode::Unauthorized);
    }

    // TODO:
    // - load the target Ship account via `target_ship`  
    // - check target’s mission mode / cooldown  
    // - resolve raid outcome (e.g., if target.mode == Unshielded steal reward)  
    // - transfer AT from target’s treasury to attacker’s  

    attacker.last_mission = clock; // optionally set attacker cooldown
    Ok(())
}

#[derive(Accounts)]
pub struct RaidMission<'info> {
    #[account(mut, has_one = owner @ ErrorCode::Unauthorized)]
    pub attacker_ship: Account<'info, Ship>,
    pub attacker: Signer<'info>,

    /// CHECK: we will fetch target ship data by key
    #[account(address = target_ship)]
    pub target_ship: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}
