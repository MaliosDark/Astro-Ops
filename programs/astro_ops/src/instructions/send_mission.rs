use anchor_lang::prelude::*;
use crate::{state::{Ship, MissionType, Mode}, errors::ErrorCode};

pub fn handler(
    ctx: Context<SendMission>,
    mission: MissionType,
    mode: Mode,
) -> Result<()> {
    let ship = &mut ctx.accounts.ship;
    let clock = Clock::get()?.unix_timestamp;

    // Check ownership
    if ship.owner != *ctx.accounts.user.key {
        return err!(ErrorCode::Unauthorized);
    }

    // Check cooldown
    if clock < ship.last_mission + ship.cooldown {
        return err!(ErrorCode::CooldownActive);
    }

    // TODO:  
    // - record a new Mission account  
    // - debit any mode-specific fee  
    // - set mission start time, type, mode  

    ship.last_mission = clock;
    Ok(())
}

#[derive(Accounts)]
pub struct SendMission<'info> {
    #[account(mut, has_one = owner @ ErrorCode::Unauthorized)]
    pub ship: Account<'info, Ship>,

    #[account(mut)]
    pub user: Signer<'info>,

    // If you plan to store each mission separately:
    // #[account(init, payer = user, space = Mission::LEN)]
    // pub mission: Account<'info, Mission>,

    pub system_program: Program<'info, System>,
}
