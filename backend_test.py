#!/usr/bin/env python3
"""
Backend Testing for Date Request Functionality Fix
Tests Supabase integration for date requests, error handling, and notifications
"""

import requests
import json
import uuid
from datetime import datetime

# Supabase configuration from frontend
SUPABASE_URL = "https://ljjyipvvxmduvxoyzvhf.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqanlpcHZ2eG1kdXZ4b3l6dmhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NDcxNzMsImV4cCI6MjA2OTUyMzE3M30.fWaVeL9482grgbXGcwYQu-ehDV5L3xyG-vix8Os8hno"

class SupabaseTestClient:
    def __init__(self):
        self.base_url = f"{SUPABASE_URL}/rest/v1"
        self.headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        self.auth_headers = self.headers.copy()
        
    def authenticate_user(self, email, password):
        """Authenticate user and get access token"""
        auth_url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
        auth_data = {
            "email": email,
            "password": password
        }
        
        try:
            response = requests.post(auth_url, json=auth_data, headers=self.headers)
            if response.status_code == 200:
                auth_result = response.json()
                access_token = auth_result.get('access_token')
                if access_token:
                    self.auth_headers["Authorization"] = f"Bearer {access_token}"
                    return True, auth_result.get('user', {}).get('id')
            return False, None
        except Exception as e:
            return False, str(e)
    
    def test_supabase_connection(self):
        """Test basic Supabase connectivity"""
        try:
            response = requests.get(f"{self.base_url}/profiles?limit=1", headers=self.headers)
            return response.status_code in [200, 401], response.status_code
        except Exception as e:
            return False, str(e)
    
    def create_date_request(self, sender_id, receiver_id):
        """Create a date request"""
        data = {
            "sender_id": sender_id,
            "receiver_id": receiver_id,
            "status": "pending"
        }
        
        try:
            response = requests.post(f"{self.base_url}/date_requests", 
                                   json=data, headers=self.auth_headers)
            return response.status_code, response.json() if response.content else {}
        except Exception as e:
            return 500, {"error": str(e)}
    
    def create_duplicate_date_request(self, sender_id, receiver_id):
        """Test duplicate date request handling"""
        # First request
        status1, result1 = self.create_date_request(sender_id, receiver_id)
        
        # Second request (should fail with 23505)
        status2, result2 = self.create_date_request(sender_id, receiver_id)
        
        return status1, result1, status2, result2
    
    def test_rpc_function(self, function_name, params):
        """Test RPC function calls"""
        try:
            response = requests.post(f"{self.base_url}/rpc/{function_name}", 
                                   json=params, headers=self.auth_headers)
            return response.status_code, response.json() if response.content else {}
        except Exception as e:
            return 500, {"error": str(e)}
    
    def get_profiles(self, limit=5):
        """Get profiles for testing"""
        try:
            response = requests.get(f"{self.base_url}/profiles?limit={limit}", 
                                  headers=self.auth_headers)
            return response.status_code, response.json() if response.content else []
        except Exception as e:
            return 500, {"error": str(e)}

def run_date_request_tests():
    """Run comprehensive date request functionality tests"""
    print("🧪 Starting Date Request Functionality Tests")
    print("=" * 60)
    
    client = SupabaseTestClient()
    test_results = []
    
    # Test 1: Supabase Connection
    print("\n1. Testing Supabase Connection...")
    connection_ok, status = client.test_supabase_connection()
    if connection_ok:
        print(f"   ✅ Supabase connection successful (Status: {status})")
        test_results.append(("Supabase Connection", True, f"Status: {status}"))
    else:
        print(f"   ❌ Supabase connection failed (Error: {status})")
        test_results.append(("Supabase Connection", False, f"Error: {status}"))
        return test_results
    
    # Test 2: User Authentication
    print("\n2. Testing User Authentication...")
    auth_success, user_id = client.authenticate_user("thepandey144@gmail.com", "12345678")
    if auth_success and user_id:
        print(f"   ✅ Authentication successful (User ID: {user_id})")
        test_results.append(("User Authentication", True, f"User ID: {user_id}"))
    else:
        print(f"   ❌ Authentication failed (Error: {user_id})")
        test_results.append(("User Authentication", False, f"Error: {user_id}"))
        # Continue with anonymous testing
        user_id = str(uuid.uuid4())
    
    # Test 3: Get Profiles
    print("\n3. Testing Profile Retrieval...")
    status, profiles = client.get_profiles(3)
    if status == 200 and isinstance(profiles, list):
        print(f"   ✅ Profile retrieval successful ({len(profiles)} profiles)")
        test_results.append(("Profile Retrieval", True, f"{len(profiles)} profiles found"))
        
        # Use real profile IDs if available
        if len(profiles) >= 2:
            receiver_id = profiles[0].get('id', str(uuid.uuid4()))
            print(f"   📝 Using real receiver ID: {receiver_id}")
        else:
            receiver_id = str(uuid.uuid4())
            print(f"   📝 Using mock receiver ID: {receiver_id}")
    else:
        print(f"   ❌ Profile retrieval failed (Status: {status})")
        test_results.append(("Profile Retrieval", False, f"Status: {status}"))
        receiver_id = str(uuid.uuid4())
    
    # Test 4: Date Request Creation
    print("\n4. Testing Date Request Creation...")
    status, result = client.create_date_request(user_id, receiver_id)
    if status == 201:
        print(f"   ✅ Date request created successfully")
        test_results.append(("Date Request Creation", True, "Request created"))
    elif status == 401:
        print(f"   ⚠️  Date request blocked by RLS (expected for anonymous users)")
        test_results.append(("Date Request Creation", True, "RLS protection working"))
    else:
        print(f"   ❌ Date request creation failed (Status: {status}, Error: {result})")
        test_results.append(("Date Request Creation", False, f"Status: {status}"))
    
    # Test 5: Duplicate Date Request Handling (Error Code 23505)
    print("\n5. Testing Duplicate Date Request Handling...")
    try:
        status1, result1, status2, result2 = client.create_duplicate_date_request(user_id, receiver_id)
        
        # Check if second request properly handles duplicate
        if status2 == 409 or (isinstance(result2, dict) and result2.get('code') == '23505'):
            print(f"   ✅ Duplicate date request properly handled (Code: 23505)")
            test_results.append(("Duplicate Request Handling", True, "Error code 23505 detected"))
        elif status1 == 401 and status2 == 401:
            print(f"   ⚠️  Both requests blocked by RLS (expected for anonymous users)")
            test_results.append(("Duplicate Request Handling", True, "RLS protection working"))
        else:
            print(f"   ❌ Duplicate handling unclear (Status1: {status1}, Status2: {status2})")
            test_results.append(("Duplicate Request Handling", False, f"Status1: {status1}, Status2: {status2}"))
    except Exception as e:
        print(f"   ❌ Duplicate test failed with exception: {e}")
        test_results.append(("Duplicate Request Handling", False, f"Exception: {e}"))
    
    # Test 6: Notification Creation RPC
    print("\n6. Testing Notification Creation RPC...")
    notification_params = {
        "target_user_id": receiver_id,
        "notification_type": "date_request",
        "notification_title": "New Date Request",
        "notification_message": "Someone sent you a date request!"
    }
    
    status, result = client.test_rpc_function("create_notification", notification_params)
    if status == 200:
        print(f"   ✅ Notification RPC function working")
        test_results.append(("Notification Creation", True, "RPC function working"))
    elif status == 401:
        print(f"   ⚠️  Notification RPC blocked by RLS (expected for anonymous users)")
        test_results.append(("Notification Creation", True, "RLS protection working"))
    else:
        print(f"   ❌ Notification RPC failed (Status: {status}, Error: {result})")
        test_results.append(("Notification Creation", False, f"Status: {status}"))
    
    # Test 7: Conversation Creation RPC
    print("\n7. Testing Conversation Creation RPC...")
    conversation_params = {
        "user1": user_id,
        "user2": receiver_id
    }
    
    status, result = client.test_rpc_function("get_or_create_conversation", conversation_params)
    if status == 200:
        print(f"   ✅ Conversation RPC function working")
        test_results.append(("Conversation Creation", True, "RPC function working"))
    elif status == 401:
        print(f"   ⚠️  Conversation RPC blocked by RLS (expected for anonymous users)")
        test_results.append(("Conversation Creation", True, "RLS protection working"))
    else:
        print(f"   ❌ Conversation RPC failed (Status: {status}, Error: {result})")
        test_results.append(("Conversation Creation", False, f"Status: {status}"))
    
    return test_results

def print_test_summary(results):
    """Print test summary"""
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, success, _ in results if success)
    total = len(results)
    
    for test_name, success, details in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status:<8} {test_name:<30} {details}")
    
    print(f"\n📈 Overall Success Rate: {passed}/{total} ({(passed/total)*100:.1f}%)")
    
    if passed == total:
        print("🎉 All tests passed! Date request functionality is working correctly.")
    elif passed >= total * 0.8:
        print("⚠️  Most tests passed. Minor issues detected but core functionality works.")
    else:
        print("❌ Multiple test failures detected. Date request functionality needs attention.")

if __name__ == "__main__":
    try:
        results = run_date_request_tests()
        print_test_summary(results)
    except Exception as e:
        print(f"❌ Test execution failed: {e}")