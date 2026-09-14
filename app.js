// Endereço oficial do USDC na Rede Base
const USDC_ADDRESS = "0x8335200cd6164806ce600d99f850e08436282913";

// ABI mínima necessária para interagir com o USDC (transferência e saldo)
const USDC_ABI = [
"function balanceOf(address account) view returns (uint256)",
"function transfer(address recipient, uint256 amount) returns (bool)"
];

let provider;
let signer;
let userAddress;

document.getElementById('connectBtn').addEventListener('click', async () => {
const statusEl = document.getElementById('status');

if (typeof window.ethereum === 'undefined') {
statusEl.innerText = "Status: Carteira Web3 não encontrada! Abra pelo navegador da carteira.";
return;
}

try {
statusEl.innerText = "Status: Conectando à carteira...";

// Inicializa o provedor Ethers v6 para a Rede Base
provider = new ethers.BrowserProvider(window.ethereum);

// Solicita acesso à conta
await provider.send("eth_requestAccounts", []);
signer = await provider.getSigner();
userAddress = await signer.getAddress();

statusEl.innerText = Conectado: ${userAddress.substring(0, 6)}...${userAddress.substring(38)};

// Altera o visual do botão e mostra os controles do jogo
document.getElementById('connectBtn').innerText = "Carteira Conectada";
document.getElementById('connectBtn').style.background = "#21262d";
document.getElementById('gameControls').style.display = "block";

} catch (error) {
console.error(error);
statusEl.innerText = "Status: Erro ao conectar carteira.";
}
});

// Ação para entrar na partida utilizando USDC na Base
document.getElementById('joinBtn')?.addEventListener('click', async () => {
const statusEl = document.getElementById('status');
if (!signer) return;

try {
statusEl.innerText = "Status: Preparando transação na Rede Base...";

const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);

// Exemplo de valor de aposta (0.05 USDC - USDC possui 6 casas decimais)
const valorAposta = ethers.parseUnits("0.05", 6);

// Endereço da tesouraria/jogo para onde vai a taxa da partida (substitua pelo seu endereço de destino se necessário)
const destino = userAddress;

statusEl.innerText = "Status: Confirme a transação na sua carteira...";
const tx = await usdcContract.transfer(destino, valorAposta);

statusEl.innerText = "Status: Processando na blockchain...";
await tx.wait();

statusEl.innerText = "Status: Sucesso! Você entrou na partida.";
} catch (error) {
console.error(error);
statusEl.innerText = "Status: Transação cancelada ou falhou.";
}
});