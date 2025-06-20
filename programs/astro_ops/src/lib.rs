use anchor_lang::prelude::*;

pub mod state;
pub mod instructions;
pub mod errors;

use instructions::*;

#[program]
pub mod astro_ops {
    use super::*;

    pub fn buy_ship(ctx: Context<BuyShip>) -> Result<()> {
        instructions::buy_ship::handler(ctx)
    }

    pub fn send_mission(
        ctx: Context<SendMission>,
        mission: state::MissionType,
        mode: state::Mode,
    ) -> Result<()> {
        instructions::send_mission::handler(ctx, mission, mode)
    }

    pub fn upgrade_ship(ctx: Context<UpgradeShip>, level: u8) -> Result<()> {
        instructions::upgrade_ship::handler(ctx, level)
    }

    pub fn raid_mission(ctx: Context<RaidMission>, target: Pubkey) -> Result<()> {
        instructions::raid_mission::handler(ctx, target)
    }

    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
        instructions::claim_rewards::handler(ctx)
    }
}
