import React from 'react';
import MissionModal from './modals/MissionModal';
import UpgradeModal from './modals/UpgradeModal';
import RaidModal from './modals/RaidModal';
import ClaimModal from './modals/ClaimModal';
import WalletBalanceModal from './modals/WalletBalanceModal';
import HowToModal from './modals/HowToModal';
import BuyShipModal from './modals/BuyShipModal';

const Modal = ({ content, onClose }) => {
  const renderModalContent = () => {
    switch (content) {
      case 'mission':
        return <MissionModal onClose={onClose} />;
      case 'upgrade':
        return <UpgradeModal onClose={onClose} />;
      case 'raid':
        return <RaidModal onClose={onClose} />;
      case 'claim':
        return <ClaimModal onClose={onClose} />;
      case 'walletBalance':
        return <WalletBalanceModal onClose={onClose} />;
        return <ClaimModal onClose={onClose} />;
      case 'howto':
        return <HowToModal onClose={onClose} />;
      case 'buyship':
        return <BuyShipModal onClose={onClose} />;
      default:
        return <div>Unknown modal content</div>;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          CLOSE
        </button>
        {renderModalContent()}
      </div>
    </div>
  );
};

export default Modal;