const USDC_ADDRESS = "0x8335200cd6164806ce600d99f850e08436282913";
const USDC_ABI = ["function transfer(address recipient, uint256 amount) returns (bool)"];
let provider, signer, userAddress;
let game = new Chess();
let selectedSquare = null;
let validMoves = [];
const pieceSymbols = { p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚', P: '♙', R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔' };
document.getElementById('connectBtn').addEventListener('click', async () => {
  const statusEl = document.getElementById('status');
  if (typeof window.ethereum === 'undefined') { statusEl.innerText = "Status: Carteira não encontrada!"; return; }
  try {
    statusEl.innerText = "Status: Conectando...";
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    userAddress = await signer.getAddress();
    statusEl.innerText = `Conectado: ${userAddress.substring(0, 6)}...${userAddress.substring(38)}`;
    document.getElementById('connectBtn').innerText = "Carteira Conectada";
    document.getElementById('connectBtn').style.background = "#21262d";
    document.getElementById('gameModes').style.display = "block";
  } catch (error) { statusEl.innerText = "Status: Erro na conexão."; }
});
document.getElementById('friendlyBtn').addEventListener('click', () => startMatch("Modo Amistoso"));
document.getElementById('nftStoreBtn').addEventListener('click', () => { alert("Coleção de Skins NFT em desenvolvimento!"); });
document.getElementById('joinBtn').addEventListener('click', async () => {
  const statusEl = document.getElementById('status');
  if (!signer) return;
  try {
    statusEl.innerText = "Status: Solicitando 0.05 USDC...";
    const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
    const tx = await usdcContract.transfer(userAddress, ethers.parseUnits("0.05", 6));
    statusEl.innerText = "Status: Gravando na blockchain...";
    await tx.wait();
    startMatch("Arena Competitiva");
  } catch (error) { statusEl.innerText = "Status: Transação cancelada."; }
});
document.getElementById('exitBtn').addEventListener('click', () => {
  document.getElementById('boardContainer').style.display = "none";
  document.getElementById('gameModes').style.display = "block";
  document.getElementById('status').innerText = "Status: Conectado.";
});
function startMatch(statusMsg) {
  document.getElementById('status').innerText = `Status: ${statusMsg}`;
  document.getElementById('gameModes').style.display = "none";
  document.getElementById('boardContainer').style.display = "block";
  game.reset(); selectedSquare = null; validMoves = []; renderBoard();
}
function renderBoard() {
  const boardEl = document.getElementById('board');
  boardEl.innerHTML = '';
  const boardData = game.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const squareEl = document.createElement('div');
      const isDark = (r + c) % 2 === 1;
      squareEl.className = `square ${isDark ? 'dark' : 'light'}`;
      const file = 'abcdefgh'[c];
      const rank = '87654321'[r];
      const squareCoord = file + rank;
      if (r === 7) {
        const fileSpan = document.createElement('span');
        fileSpan.className = 'coord-file'; fileSpan.innerText = file; squareEl.appendChild(fileSpan);
      }
      if (c === 0) {
        const rankSpan = document.createElement('span');
        rankSpan.className = 'coord-rank'; rankSpan.innerText = rank; squareEl.appendChild(rankSpan);
      }
      if (selectedSquare === squareCoord) squareEl.classList.add('selected');
      if (validMoves.includes(squareCoord)) squareEl.classList.add('highlight');
      const piece = boardData[r][c];
      if (piece) {
        const pieceDiv = document.createElement('div');
        pieceDiv.className = `piece ${piece.color === 'w' ? 'piece-w' : 'piece-b'}`;
        pieceDiv.innerText = pieceSymbols[piece.color === 'w' ? piece.type.toUpperCase() : piece.type.toLowerCase()];
        squareEl.appendChild(pieceDiv);
      }
      squareEl.addEventListener('click', () => handleSquareClick(squareCoord));
      boardEl.appendChild(squareEl);
    }
  }
  if (game.in_checkmate()) { document.getElementById('status').innerText = "Fim de Jogo: Xeque-Mate!"; }
  else if (game.in_draw()) { document.getElementById('status').innerText = "Fim de Jogo: Empate!"; }
}
function handleSquareClick(square) {
  if (!selectedSquare) {
    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      selectedSquare = square;
      validMoves = game.moves({ square: square, verbose: true }).map(m => m.to);
      renderBoard();
    }
  } else {
    const move = game.move({ from: selectedSquare, to: square, promotion: 'q' });
    selectedSquare = null; validMoves = [];
    if (move) { renderBoard(); }
    else {
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        selectedSquare = square;
        validMoves = game.moves({ square: square, verbose: true }).map(m => m.to);
      }
      renderBoard();
    }
  }
}
