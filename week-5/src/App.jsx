import React, { FC, useMemo, useState, useEffect } from 'react';
import { ConnectionProvider, WalletProvider, useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { UnsafeBurnerWalletAdapter, PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import {
    WalletModalProvider,
    WalletDisconnectButton,
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as spl from '@solana/spl-token';

import '@solana/wallet-adapter-react-ui/styles.css';
import { Airdrop } from './Airdrop';

const ShowTokens = () => {
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const [tokens, setTokens] = useState([]);

    useEffect(() => {
        const fetchTokens = async () => {
            if (!publicKey) return;

            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
                programId: spl.TOKEN_PROGRAM_ID,
            });

            const tokenList = tokenAccounts.value.map((tokenAccount) => ({
                mint: tokenAccount.account.data.parsed.info.mint,
                balance: tokenAccount.account.data.parsed.info.tokenAmount.uiAmount,
            }));

            setTokens(tokenList);
        };

        fetchTokens();
    }, [connection, publicKey]);

    return (
        <div>
            <h2>Your Tokens:</h2>
            <ul>
                {tokens.map((token, index) => (
                    <li key={index}>
                        Mint: {token.mint}, Balance: {token.balance}
                    </li>
                ))}
            </ul>
        </div>
    );
};



const TransferToken = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [mint, setMint] = useState('');
  const [error, setError] = useState('');

  const handleTransfer = async (e) => {
      e.preventDefault();
      setError('');
      if (!publicKey) {
          setError('Wallet not connected');
          return;
      }

      try {
          // Validate inputs
          if (!recipient || !amount || !mint) {
              setError('Please fill all fields');
              return;
          }

          const recipientPubkey = new PublicKey(recipient);
          const mintPubkey = new PublicKey(mint);

          if (recipientPubkey.equals(publicKey)) {
              setError('Recipient address must be different from your address');
              return;
          }

   
          const fromTokenAccount = await spl.getAssociatedTokenAddress(
              mintPubkey,
              publicKey
          );
          const toTokenAccount = await spl.getAssociatedTokenAddress(
              mintPubkey,
              recipientPubkey
          );

          // Check if sender's token account exists
          const fromAccountInfo = await connection.getAccountInfo(fromTokenAccount);
          if (!fromAccountInfo) {
              setError("You don't have a token account for this mint");
              return;
          }

          
          const transaction = new Transaction();

    
          const toAccountInfo = await connection.getAccountInfo(toTokenAccount);
          if (!toAccountInfo) {
              transaction.add(
                  spl.createAssociatedTokenAccountInstruction(
                      publicKey,
                      toTokenAccount,
                      recipientPubkey,
                      mintPubkey
                  )
              );
          }

          // Add transfer instruction
          transaction.add(
              spl.createTransferInstruction(
                  fromTokenAccount,
                  toTokenAccount,
                  publicKey,
                  BigInt(Math.floor(parseFloat(amount) * (10 ** 9))) 
              )
          );

  
          const signature = await sendTransaction(transaction, connection);
          await connection.confirmTransaction(signature, 'confirmed');
          alert('Transfer successful!');
      } catch (error) {
          console.error('Error:', error);
          setError('Transfer failed: ' + error.message);
      }
  };

  return (
      <form onSubmit={handleTransfer}>
          <input
              type="text"
              placeholder="Recipient Address"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
          />
          <input
              type="text"
              placeholder="Token Mint Address"
              value={mint}
              onChange={(e) => setMint(e.target.value)}
          />
          <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
          />
          <button type="submit">Transfer</button>
          {error && <p style={{color: 'red'}}>{error}</p>}
      </form>
  );
};



function App() {
    const network = WalletAdapterNetwork.Devnet;
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);

    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new UnsafeBurnerWalletAdapter(),
        ],
        [network]
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <WalletMultiButton />
                    <WalletDisconnectButton />
                    <Airdrop />
                    <ShowTokens />
                    <TransferToken />
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}

export default App;