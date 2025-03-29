import React, { useState, useEffect } from 'react';

function TransactionApproval({ navigateTo }) {
  const [transaction, setTransaction] = useState(null);
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    // Get transaction details from background script
    chrome.runtime.sendMessage(
      { type: 'GET_PENDING_TRANSACTION' },
      (response) => {
        if (response.success) {
          setTransaction(response.transaction);
        }
      }
    );
  }, []);

  const approveTransaction = () => {
    setIsApproving(true);
    chrome.runtime.sendMessage(
      { type: 'APPROVE_TRANSACTION' },
      (response) => {
        if (response.success) {
          navigateTo('dashboard');
        } else {
          alert('Transaction failed: ' + (response.error || 'Unknown error'));
          setIsApproving(false);
        }
      }
    );
  };

  const rejectTransaction = () => {
    chrome.runtime.sendMessage(
      { type: 'REJECT_TRANSACTION' },
      () => {
        navigateTo('dashboard');
      }
    );
  };

  if (!transaction) {
    return <div>Loading transaction details...</div>;
  }

  return (
    <div className="transaction-approval">
      <h2>Approve Transaction</h2>
      
      <div className="card">
        <h3 className="card-title">Transaction Details</h3>
        
        <div className="transaction-detail">
          <span className="detail-label">Network:</span>
          <span className="detail-value">{transaction.network}</span>
        </div>
        
        {transaction.from && (
          <div className="transaction-detail">
            <span className="detail-label">From:</span>
            <span className="detail-value">{transaction.from}</span>
          </div>
        )}
        
        <div className="transaction-detail">
          <span className="detail-label">To:</span>
          <span className="detail-value">{transaction.to}</span>
        </div>
        
        <div className="transaction-detail">
          <span className="detail-label">Amount:</span>
          <span className="detail-value">
            {transaction.value} {transaction.network === 'ethereum' ? 'ETH' : 'SOL'}
          </span>
        </div>
        
        {transaction.gasEstimate && (
          <div className="transaction-detail">
            <span className="detail-label">Estimated Gas:</span>
            <span className="detail-value">{transaction.gasEstimate}</span>
          </div>
        )}
        
        {transaction.data && (
          <div className="transaction-detail">
            <span className="detail-label">Data:</span>
            <div className="transaction-data">
              {transaction.data}
            </div>
          </div>
        )}
      </div>
      
      <div className="transaction-actions">
        <button
          className="btn btn-primary"
          onClick={approveTransaction}
          disabled={isApproving}
        >
          {isApproving ? 'Approving...' : 'Approve'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={rejectTransaction}
          style={{ marginLeft: '8px' }}
        >
          Reject
        </button>
      </div>
    </div>
  );
}

export default TransactionApproval;