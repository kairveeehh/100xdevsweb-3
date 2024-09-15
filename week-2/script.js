let mnemo = '';
let wallets = [];

document.getElementById('generateMnemonic').addEventListener('click', () => {

    mnemo = ethers.utils.entropyToMnemonic(ethers.utils.randomBytes(16));
    document.getElementById('mnemonicDisplay').textContent = mnemo;
});

document.getElementById('addWallet').addEventListener('click', () => {
    if (!mnemo) {
        alert('Please generate a mnemo first');
        return;
    }
  
    const hdNode = ethers.utils.HDNode.fromMnemonic(mnemo);
    const wallet = hdNode.derivePath(`m/44'/60'/0'/0/${wallets.length}`);
    wallets.push(wallet);
    displayWallets();
});

function displayWallets() {
    const walletList = document.getElementById('walletList');
    walletList.innerHTML = '';
    wallets.forEach((wallet, index) => {
        const walletInfo = document.createElement('p');
        walletInfo.textContent = `Wallet ${index + 1}: ${wallet.address}`;
        walletList.appendChild(walletInfo);
    });
}