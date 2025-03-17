import { Connection, Keypair, VersionedTransaction } from "@solana/web3.js";
import fetch from "cross-fetch";
import { Wallet } from "@project-serum/anchor";
import bs58 from "bs58";

// It is recommended that you use your own RPC endpoint.
// This RPC endpoint is only for demonstration purposes so that this example will run.
const connection = new Connection(
 'https://api.mainnet-beta.solana.com'
);
const wallet = new Wallet(
  Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY || ""))
);

// Swapping SOL to USDC with input 0.1 SOL and 0.5% slippage
async function swap() {
  const res =
    await axios.get(
      "https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112\
      &outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v\
      &amount=100000000\
      &slippageBps=50"
    );

  const quoteResponse = res.data;
  console.log({ quoteResponse });

  // get serialized transactions for the swap
  try {
    const { data:{ swapTransaction } } =
        await axios("https://quote-api.jup.ag/v6/swap",{
            quoteResponse,
            userPublicKey: wallet.publicKey.toString(),
        });
      // deserialize the transaction

      console.log(swapTransaction);
      
      const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
      var transaction = VersionedTransaction.deserialize(swapTransactionBuf);
      console.log(transaction);
    
      // sign the transaction
      transaction.sign([wallet.payer]);
    
      // get the latest block hash
      const latestBlockHash = await connection.getLatestBlockhash();
    
      // Execute the transaction
      const rawTransaction = transaction.serialize();
      const txid = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
        maxRetries: 2,
      });
      await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: txid,
      });
      console.log(`https://solscan.io/tx/${txid}`);
  } catch (error) {
    console.error(error);
  }
}

swap();
