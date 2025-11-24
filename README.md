# CheersBoard — FHE 祝福墙 (本地 mock + Sepolia relayer)

## 目录结构

- `contracts/` — Hardhat 工程，包含 `CheersBoard.sol` 与部署脚本（需要 `@fhevm/hardhat-plugin`）
- `frontend/` — Next.js 前端，含 FHEVM 集成（mock/relayer 双模式）、演示页面与 ABI 生成脚本

## 本地运行（mock + Hardhat FHEVM 节点）

1. 在根目录（action/contracts）安装依赖并启动 Hardhat 节点（建议使用 FHEVM Hardhat 节点）

```bash
cd action/contracts
npm i
# 另起终端启动 Hardhat 节点（请使用带 FHEVM 插件的 hardhat 节点）
# npx hardhat node

# 部署合约
npm run deploy:localhost
```

2. 生成前端 ABI 与地址映射

```bash
cd ../frontend
npm i
npm run genabi
npm run dev
```

3. 打开前端（默认 http://localhost:3001），连接 MetaMask 到 `localhost:8545 (chainId=31337)`，即可使用 mock 实例进行本地加密/解密与合约交互。

## 测试网运行（Sepolia + relayer-sdk）

1. 在 `action/contracts/.env` 设置：

```bash
SEPOLIA_RPC_URL=...
SEPOLIA_PRIVATE_KEY=...
```

2. 部署合约并生成 ABI：

```bash
cd action/contracts
npm run deploy:sepolia

cd ../frontend
npm run genabi
npm run dev
```

3. 前端连接钱包并切换到 Sepolia，前端将自动加载 CDN `relayer-sdk` 并创建实例，进行加解密与交互。

## 功能说明（演示版）

- 创建墙（输入 wallCID 文本，实际应前端上传 JSON 到 IPFS 获得 CID）
- 发布祝福（输入 postCID 文本，实际应前端上传 JSON 到 IPFS 获得 CID）
- 点赞：使用 FHE 在本地加密 +1，调用合约的 `likePost`，链上密文相加
- 解密：使用 `userDecrypt` 对密文句柄解密，显示明文 like 数

> 说明：演示版聚焦 FHE 加密/解密流程与基础数据结构，后续可扩展打赏、举报、NFT、The Graph 索引与更完整的 UI。

## 注意

- 本地 mock 模式需要 Hardhat FHEVM 节点以响应 `fhevm_relayer_metadata`
- 如遇 KMSVerifierAddress 报错，请确认本地 precompiled 地址文件包含 `KMSVerifierAddress` 并重启节点


