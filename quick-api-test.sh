#!/bin/bash

# Quick API test script for Hardhat Web UI
# Tests all GET endpoints under localhost:3337/api/

BASE_URL="http://localhost:3337/api"

# Helper function to test GET endpoints
test_get_endpoint() {
    local endpoint=$1
    local description=$2
    echo "\nTesting $description: $BASE_URL$endpoint"
    curl -s -w "\nStatus Code: %{http_code}\n" "$BASE_URL$endpoint"
    echo "--------------------------------------------------"
}

# Test Network Information
test_get_endpoint "/network" "Network Information"
test_get_endpoint "/network/last-block" "Latest Block Height"

# Test Account Endpoints
test_get_endpoint "/account" "Account List"
test_get_endpoint "/account/0x1234567890123456789012345678901234567890" "Account Details (Example Address)"

# Test Block Endpoints
test_get_endpoint "/block" "Block List"
test_get_endpoint "/block/by-hash/0x2387aafb4b8f2ddc55bf44da44c62a331eb51e12beb59dec3dd3078cf4ce4df6" "Block Details by Hash"
test_get_endpoint "/block/by-number/1" "Block Details by Number"
test_get_endpoint "/block/block-tx/0x2387aafb4b8f2ddc55bf44da44c62a331eb51e12beb59dec3dd3078cf4ce4df6" "Block Transactions by Hash"

# Test Contract Endpoints
test_get_endpoint "/contract" "Contract List"
# test_get_endpoint "/contract/Greeter" "Contract Details (Example Contract: Greeter)"

# Test Transaction Endpoints
test_get_endpoint "/tx" "Transaction List"
test_get_endpoint "/tx/0x0000000000000000000000000000000000000000000000000000000000000000" "Transaction Details (Example Hash)"

 echo "\nAPI tests completed\n"