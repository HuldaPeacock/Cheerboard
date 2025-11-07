// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title CheersBoard — FHE-enabled Blessing Wall
/// @notice Minimal v1 aligning with the product doc, demonstrating FHE for encrypted like counters.
contract CheersBoard is SepoliaConfig {
    struct Wall {
        uint256 wallId;
        address organizer;
        // Basic readable fields for demo (could be moved to IPFS in prod)
        string title;
        string description;
        string coverCID; // optional image on IPFS
        uint256 startTime;
        uint256 endTime;
        bool allowAnonymous;
        bool allowMedia;
        uint256 postFee; // optional fee in wei
        bool autoMint; // not implemented in v1
    }

    struct Post {
        uint256 postId;
        uint256 wallId;
        address author;
        // Readable fields for demo
        string title;
        string content;
        string mediaCID; // optional media on IPFS
        uint256 timestamp;
        bool removed;
        // FHE encrypted counters
        euint32 encryptedLikeCount;
    }

    event WallCreated(uint256 indexed wallId, address indexed organizer, string title, string coverCID);
    event PostCreated(uint256 indexed wallId, uint256 indexed postId, address indexed author, string title);
    event PostLiked(uint256 indexed wallId, uint256 indexed postId, address indexed from);
    event PostRemoved(uint256 indexed wallId, uint256 indexed postId, address moderator);

    uint256 public nextWallId = 1;
    uint256 public nextPostId = 1;

    mapping(uint256 => Wall) public walls; // wallId => Wall
    mapping(uint256 => Post) public posts; // postId => Post
    mapping(uint256 => uint256[]) public wallToPosts; // wallId => postIds

    modifier onlyOrganizer(uint256 wallId) {
        require(walls[wallId].organizer == msg.sender, "Not organizer");
        _;
    }

    function createWall(
        string calldata title,
        string calldata description,
        string calldata coverCID,
        uint256 startTime,
        uint256 endTime,
        bool allowAnonymous,
        bool allowMedia,
        uint256 postFee,
        bool autoMint
    ) external returns (uint256 wallId) {
        require(bytes(title).length > 0, "Invalid title");
        require(endTime == 0 || endTime >= startTime, "Invalid time range");

        wallId = nextWallId++;
        walls[wallId] = Wall({
            wallId: wallId,
            organizer: msg.sender,
            title: title,
            description: description,
            coverCID: coverCID,
            startTime: startTime,
            endTime: endTime,
            allowAnonymous: allowAnonymous,
            allowMedia: allowMedia,
            postFee: postFee,
            autoMint: autoMint
        });

        emit WallCreated(wallId, msg.sender, title, coverCID);
    }

    function postBlessing(
        uint256 wallId,
        string calldata title,
        string calldata content,
        string calldata mediaCID
    ) external payable returns (uint256 postId) {
        Wall storage w = walls[wallId];
        require(w.organizer != address(0), "Wall not found");
        require(bytes(title).length > 0, "Invalid title");
        require(bytes(content).length > 0, "Invalid content");
        if (w.postFee > 0) {
            require(msg.value >= w.postFee, "Insufficient post fee");
        }

        postId = nextPostId++;

        Post storage p = posts[postId];
        p.postId = postId;
        p.wallId = wallId;
        p.author = msg.sender;
        p.title = title;
        p.content = content;
        p.mediaCID = mediaCID;
        p.timestamp = block.timestamp;
        p.removed = false;
        // encryptedLikeCount defaults to 0 (uninitialized handle)
        // Do NOT call FHE.allow/allowThis here, it would revert on zero-handle.

        wallToPosts[wallId].push(postId);

        emit PostCreated(wallId, postId, msg.sender, title);
    }

    /// @notice Encrypted like increment. The caller provides an encrypted increment value (e.g., 1)
    /// @dev Demonstrates FHE.fromExternal + FHE.add on a per-post encrypted counter
    function likePost(
        uint256 wallId,
        uint256 postId,
        externalEuint32 encryptedIncrement,
        bytes calldata inputProof
    ) external {
        Wall storage w = walls[wallId];
        require(w.organizer != address(0), "Wall not found");
        Post storage p = posts[postId];
        require(p.wallId == wallId, "Invalid post");
        require(!p.removed, "Removed");

        euint32 inc = FHE.fromExternal(encryptedIncrement, inputProof);
        p.encryptedLikeCount = FHE.add(p.encryptedLikeCount, inc);

        // Allow contract, post author and liker to decrypt
        FHE.allowThis(p.encryptedLikeCount);
        FHE.allow(p.encryptedLikeCount, p.author);
        FHE.allow(p.encryptedLikeCount, msg.sender);

        emit PostLiked(wallId, postId, msg.sender);
    }

    /// @notice Returns the encrypted like counter of a post
    function getEncryptedLikeCount(uint256 wallId, uint256 postId) external view returns (euint32) {
        Post storage p = posts[postId];
        require(p.wallId == wallId, "Invalid post");
        return p.encryptedLikeCount;
    }

    /// @notice Soft-remove a post (auditability preserved on-chain)
    function removePost(uint256 wallId, uint256 postId) external onlyOrganizer(wallId) {
        Post storage p = posts[postId];
        require(p.wallId == wallId, "Invalid post");
        require(!p.removed, "Already removed");
        p.removed = true;
        emit PostRemoved(wallId, postId, msg.sender);
    }

    /// @notice Basic getters for pagination (for demo; prefer The Graph in prod)
    function getWall(uint256 wallId) external view returns (Wall memory) {
        return walls[wallId];
    }

    function getPost(uint256 postId) external view returns (Post memory) {
        return posts[postId];
    }

    function getPostsByWall(uint256 wallId) external view returns (uint256[] memory) {
        return wallToPosts[wallId];
    }
}


