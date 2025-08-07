#!/usr/bin/env python3
"""
Backend API Testing Script
Tests the FastAPI backend endpoints for the dating application.
"""

import requests
import json
import sys
from datetime import datetime
import uuid

# Backend URL - using internal port since no external URL is configured
BASE_URL = "http://localhost:8001/api"

def test_root_endpoint():
    """Test GET /api/ endpoint"""
    print("Testing GET /api/ endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("message") == "Hello World":
                print("✅ Root endpoint working correctly")
                return True
            else:
                print("❌ Root endpoint returned unexpected message")
                return False
        else:
            print(f"❌ Root endpoint failed with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Root endpoint test failed with error: {e}")
        return False

def test_post_status_endpoint():
    """Test POST /api/status endpoint"""
    print("\nTesting POST /api/status endpoint...")
    try:
        test_data = {
            "client_name": "test_client_backend_api"
        }
        
        response = requests.post(f"{BASE_URL}/status", json=test_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if (data.get("client_name") == "test_client_backend_api" and 
                "id" in data and "timestamp" in data):
                print("✅ POST status endpoint working correctly")
                return True, data.get("id")
            else:
                print("❌ POST status endpoint returned unexpected data structure")
                return False, None
        else:
            print(f"❌ POST status endpoint failed with status {response.status_code}")
            return False, None
    except Exception as e:
        print(f"❌ POST status endpoint test failed with error: {e}")
        return False, None

def test_get_status_endpoint():
    """Test GET /api/status endpoint"""
    print("\nTesting GET /api/status endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/status")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: Found {len(data)} status checks")
            
            if isinstance(data, list):
                print("✅ GET status endpoint working correctly")
                # Check if our test data is in the response
                test_entries = [item for item in data if item.get("client_name") == "test_client_backend_api"]
                if test_entries:
                    print(f"✅ Found {len(test_entries)} test entries in database")
                return True
            else:
                print("❌ GET status endpoint returned non-list data")
                return False
        else:
            print(f"❌ GET status endpoint failed with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ GET status endpoint test failed with error: {e}")
        return False

def test_mongodb_connection():
    """Test MongoDB connection by creating and retrieving data"""
    print("\nTesting MongoDB connection...")
    
    # First create a status check
    post_success, created_id = test_post_status_endpoint()
    if not post_success:
        print("❌ MongoDB connection test failed - could not create data")
        return False
    
    # Then retrieve all status checks
    get_success = test_get_status_endpoint()
    if not get_success:
        print("❌ MongoDB connection test failed - could not retrieve data")
        return False
    
    print("✅ MongoDB connection working correctly")
    return True

def test_cors_configuration():
    """Test CORS configuration"""
    print("\nTesting CORS configuration...")
    try:
        # Make an OPTIONS request to check CORS headers
        response = requests.options(f"{BASE_URL}/")
        print(f"OPTIONS Status Code: {response.status_code}")
        
        # Check for CORS headers
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
        }
        
        print("CORS Headers:")
        for header, value in cors_headers.items():
            print(f"  {header}: {value}")
        
        if cors_headers['Access-Control-Allow-Origin'] == '*':
            print("✅ CORS configuration working correctly")
            return True
        else:
            print("❌ CORS configuration may have issues")
            return False
    except Exception as e:
        print(f"❌ CORS test failed with error: {e}")
        return False

def run_all_tests():
    """Run all backend API tests"""
    print("=" * 60)
    print("BACKEND API TESTING")
    print("=" * 60)
    print(f"Testing backend at: {BASE_URL}")
    print(f"Test started at: {datetime.now()}")
    print("=" * 60)
    
    results = []
    
    # Test individual endpoints
    results.append(("Root Endpoint (GET /api/)", test_root_endpoint()))
    results.append(("Status Creation (POST /api/status)", test_post_status_endpoint()[0]))
    results.append(("Status Retrieval (GET /api/status)", test_get_status_endpoint()))
    results.append(("MongoDB Connection", test_mongodb_connection()))
    results.append(("CORS Configuration", test_cors_configuration()))
    
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = 0
    failed = 0
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
        else:
            failed += 1
    
    print("=" * 60)
    print(f"Total Tests: {len(results)}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Success Rate: {(passed/len(results)*100):.1f}%")
    print("=" * 60)
    
    return failed == 0

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)