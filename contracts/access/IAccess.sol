pragma solidity ^0.8.0; 

interface IAccess {
  function isMinter(address _manager) external view returns (bool);
  function isOwner(address _manager) external view returns (bool);
  function isSender(address _manager) external view returns (bool);
  function isSigner(address _manager) external view returns (bool);
  function preAuthValidations(bytes32 message, bytes32 token, bytes memory signature) external returns (address);
}