use anchor_lang::prelude::*;

#[account]
pub struct Ship {
    pub owner: Pubkey,
    pub level: u8,
    pub last_mission: i64,
}

impl Ship {
    pub const LEN: usize = 8 + 32 + 1 + 8;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum MissionType {
    MiningRun,
    BlackMarket,
    ArtifactHunt,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum Mode {
    Shielded,
    Unshielded,
    Decoy,
}
