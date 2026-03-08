const { ethers } = require("ethers");
const axios = require("axios");

const CONTRACT = "0xe277A7643562775C4f4257E23B068ba8F45608b4";
const RPC = "https://rpc.apechain.com";
const WEBHOOK = "https://discord.com/api/webhooks/1480039696426991697/bc47-dpQWCay4cyNpvaYcEnX6hY4KirKs3ZaB1grDuvQIlO7blAqUetwigPBK0Od-X-k";

const OPENSEA_COLLECTION = "https://opensea.io/collection/primalcult";
const IMAGE_BASE = "https://ipfs.primalcult.xyz/images";

const provider = new ethers.JsonRpcProvider(RPC);

const abi = [
"event Transfer(address indexed from,address indexed to,uint256 indexed tokenId)"
];

const contract = new ethers.Contract(CONTRACT, abi, provider);

let lastBlock = 0;

console.log("🦍 Primal Cult Sales Bot running...");

function short(addr){
return addr.slice(0,6);
}

async function getAPEPrice(){

try{

const res = await axios.get(
"https://api.coingecko.com/api/v3/simple/price?ids=apecoin&vs_currencies=usd"
);

return res.data.apecoin.usd;

}catch{

return null;

}

}

async function checkSales(){

try{

const currentBlock = await provider.getBlockNumber();

if(lastBlock === 0){
lastBlock = currentBlock - 1;
}

const events = await contract.queryFilter(
contract.filters.Transfer(),
lastBlock,
currentBlock
);

lastBlock = currentBlock;

for(const event of events){

const from = event.args.from;
const to = event.args.to;
const tokenId = event.args.tokenId;

if(from === "0x0000000000000000000000000000000000000000") continue;

const tx = await provider.getTransaction(event.transactionHash);

const priceAPE = Number(ethers.formatEther(tx.value));

if(priceAPE === 0) continue;

const apeUSD = await getAPEPrice();

let usdValue = "N/A";

if(apeUSD){
usdValue = (priceAPE * apeUSD).toFixed(2);
}

const image = `${IMAGE_BASE}/${tokenId}.gif`;
const opensea = `${OPENSEA_COLLECTION}/${tokenId}`;

const embed = {

title: "NEW Primal Cult BUY!",
url: opensea,

description:
`🦍 Primal Cult #${tokenId} sold!
💰 Price: ${priceAPE.toFixed(2)} APE | $${usdValue}
👤 From: ${short(from)} ➡ To: ${short(to)}`,

image:{
url:image
},

color: 16753920

};

await axios.post(WEBHOOK,{embeds:[embed]});

console.log("Sale detected →", tokenId);

}

}catch(e){

console.log("Error:",e.message);

}

}

setInterval(checkSales,15000);