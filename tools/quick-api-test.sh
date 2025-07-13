#!/bin/bash

# Quick API test script for Hardhat Web UI
# Tests all GET endpoints under localhost:3337/api/

BASE_URL="http://localhost:3337/api"

# Helper function to test GET endpoints
test_get_endpoint() {
    local endpoint=$1
    local description=$2
    echo "\\nTesting $description: $BASE_URL$endpoint"
    curl -s -w "\\nStatus Code: %{http_code}\\n" "$BASE_URL$endpoint"
    echo "--------------------------------------------------"
}

if [ ! -z "$1" ]; then
    test_get_endpoint "$1" ""
    exit 0
fi

# Test Network Information
test_get_endpoint "/network/info" "Network Information"
test_get_endpoint "/network/latest-block" "Latest Block Height"

# Test Account Endpoints
test_get_endpoint "/account" "Account List"
test_get_endpoint "/account/0x976EA74026E726554dB657fA54763abd0C3a0aa9" "Account Details (Example Address)"

# Test Block Endpoints
test_get_endpoint "/block" "Block List"
test_get_endpoint "/block/0x87fecbdd41a7fbd4b121cf717420e7fb40d6415449b933dd95fe7ee4b5c7c862" "Block Details by Hash"
test_get_endpoint "/block/1" "Block Details by Number"

# Test Contract Endpoints
test_get_endpoint "/contract" "Contract List"
test_get_endpoint "/contract/Lock" "Contract Details (Example Contract: Lock)"

# Test Transaction Endpoints
test_get_endpoint "/transaction" "Transaction List"
test_get_endpoint "/transaction/0x733c0f05edf8cfacd5c36a5d78472902947e07815dc3fb4d591a5211e40e55f4" "Transaction Details (Example Hash)"

echo "\\nAPI tests completed\\n"

