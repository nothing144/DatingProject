#!/usr/bin/env python3
"""
Backend API Testing Script
Tests FastAPI backend endpoints to verify functionality after cleanup
"""

import requests
import json
import sys
from datetime import datetime

# Backend configuration from frontend/.env
BACKEND_URL = "http://localhost:8001"
API_BASE = f"{BACKEND_URL}/api"

def test_root_endpoint():
    """Test GET /api/ endpoint"""
    print("🔍 Testing GET /api/ (root endpoint)...")
    try:
        response = requests.get(f"{API_BASE}/")
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.json()}")
        
        if response.status_code == 200 and response.json().get("message") == "Hello World":
            print("   ✅ Root endpoint working correctly")
            return True
        else:
            print("   ❌ Root endpoint failed - unexpected response")
            return False
    except Exception as e:
        print(f"   ❌ Root endpoint failed with error: {e}")
        return False

def test_create_status_check():
    """Test POST /api/status endpoint"""
    print("\n🔍 Testing POST /api/status (create status check)...")
    try:
        test_data = {
            "client_name": "test_client_backend_verification"
        }
        
        response = requests.post(f"{API_BASE}/status", json=test_data)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Response: {json.dumps(data, indent=2)}")
            
            # Verify response structure
            if all(key in data for key in ["id", "client_name", "timestamp"]):
                if data["client_name"] == test_data["client_name"]:
                    print("   ✅ Create status check working correctly")
                    return True, data["id"]
                else:
                    print("   ❌ Create status check failed - client_name mismatch")
                    return False, None
            else:
                print("   ❌ Create status check failed - missing required fields")
                return False, None
        else:
            print(f"   ❌ Create status check failed with status {response.status_code}")
            return False, None
    except Exception as e:
        print(f"   ❌ Create status check failed with error: {e}")
        return False, None

def test_get_status_checks():
    """Test GET /api/status endpoint"""
    print("\n🔍 Testing GET /api/status (retrieve status checks)...")
    try:
        response = requests.get(f"{API_BASE}/status")
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Found {len(data)} status checks")
            
            if len(data) > 0:
                print(f"   Sample record: {json.dumps(data[0], indent=2)}")
                # Verify structure of first record
                if all(key in data[0] for key in ["id", "client_name", "timestamp"]):
                    print("   ✅ Get status checks working correctly")
                    return True
                else:
                    print("   ❌ Get status checks failed - invalid record structure")
                    return False
            else:
                print("   ✅ Get status checks working correctly (empty result)")
                return True
        else:
            print(f"   ❌ Get status checks failed with status {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Get status checks failed with error: {e}")
        return False

def test_cors_headers():
    """Test CORS headers configuration"""
    print("\n🔍 Testing CORS headers...")
    try:
        response = requests.get(f"{API_BASE}/")
        cors_header = response.headers.get('Access-Control-Allow-Origin')
        print(f"   CORS Header: {cors_header}")
        
        if cors_header == "*":
            print("   ✅ CORS properly configured")
            return True
        else:
            print("   ❌ CORS not properly configured")
            return False
    except Exception as e:
        print(f"   ❌ CORS test failed with error: {e}")
        return False

def test_mongodb_connection():
    """Test MongoDB connection indirectly through API"""
    print("\n🔍 Testing MongoDB connection (via API)...")
    try:
        # Create a test record
        test_data = {"client_name": "mongodb_connection_test"}
        create_response = requests.post(f"{API_BASE}/status", json=test_data)
        
        if create_response.status_code == 200:
            # Try to retrieve records
            get_response = requests.get(f"{API_BASE}/status")
            if get_response.status_code == 200:
                records = get_response.json()
                # Check if our test record exists
                test_record_found = any(r["client_name"] == "mongodb_connection_test" for r in records)
                if test_record_found:
                    print("   ✅ MongoDB connection working - data persisted and retrieved")
                    return True
                else:
                    print("   ❌ MongoDB connection issue - data not persisted")
                    return False
            else:
                print("   ❌ MongoDB connection issue - cannot retrieve data")
                return False
        else:
            print("   ❌ MongoDB connection issue - cannot create data")
            return False
    except Exception as e:
        print(f"   ❌ MongoDB connection test failed with error: {e}")
        return False

def main():
    """Run all backend tests"""
    print("=" * 60)
    print("🚀 BACKEND API TESTING - FastAPI + MongoDB")
    print("=" * 60)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"API Base: {API_BASE}")
    print("=" * 60)
    
    tests = [
        ("Root Endpoint", test_root_endpoint),
        ("Create Status Check", lambda: test_create_status_check()[0]),
        ("Get Status Checks", test_get_status_checks),
        ("CORS Headers", test_cors_headers),
        ("MongoDB Connection", test_mongodb_connection)
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"   ❌ {test_name} failed with exception: {e}")
            results.append((test_name, False))
    
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
        if result:
            passed += 1
    
    print("=" * 60)
    print(f"🎯 OVERALL: {passed}/{total} tests passed ({(passed/total)*100:.1f}% success rate)")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED - Backend is working correctly!")
        return True
    else:
        print("⚠️  SOME TESTS FAILED - Backend needs attention")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)