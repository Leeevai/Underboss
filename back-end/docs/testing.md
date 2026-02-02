# Comprehensive API Test Script

Bash script that thoroughly tests every endpoint and parameter combination in the Underboss API.

## Features

- **100+ Test Cases** covering all functionality
- **Complete Workflows** from user registration to payment completion
- **Error Testing** validates all error conditions
- **Detailed Output** with color-coded pass/fail indicators
- **Test Summary** shows total, passed, and failed counts
- **Real API Calls** using curl and jq

## Prerequisites

```bash
# Install required tools
sudo apt install curl jq

# Start the Underboss server
make running

# Verify server is running
curl http://localhost:5000/uptime
```

## Usage

```bash
# Run with default URL (http://localhost:5000)
./comprehensive_test.sh

# Run with custom URL
./comprehensive_test.sh http://your-server:5000
```

## Test Coverage

### System Routes (7 tests)
- Health check
- System info
- Database stats
- User authentication check

### Authentication (10 tests)
- User registration (valid, invalid, duplicate)
- Login with Basic Auth
- Login with form parameters
- Login with email/phone
- Token generation
- Invalid credentials

### User Management (8 tests)
- List users
- Filter users
- Create user (admin)
- Get user by ID/username
- Update user (PATCH/PUT)
- Update password/email/admin status
- Get non-existent user

### Profile Management (15 tests)
- Get current profile
- Update profile (PUT/PATCH)
- Update location with coordinates
- Invalid latitude/longitude
- Date of birth
- **Gender field** (male, female, non-binary, other, prefer-not-to-say)
- **Invalid gender value** (should fail)
- Public profile viewing
- Add/update/delete work experience
- **Experience display_order** for custom ordering
- List experiences

### Categories (9 tests)
- List all categories
- Filter by parent
- Create category/subcategory
- Get category details
- Update category
- Add/remove user interests
- List interests

### Job Postings - PAPS (22 tests)
- Create draft/published posting
- List all postings
- Filter by status/owner/category
- Location-based search with radius
- Text search
- Payment amount filtering
- Sorting and pagination
- Get specific posting details
- Update posting (PUT/PATCH)
- **Create schedule** (once, daily, weekly, biweekly, monthly, custom)
- **Get all schedules**
- **Get specific schedule**
- **Update schedule** (recurrence, dates, is_active)
- **Delete schedule**
- **Custom schedule with cron expression**
- **Custom without cron (should fail)**
- **Non-owner schedule access (should fail)**
- Media upload

### Applications - SPAP (10 tests)
- Submit application with/without cover letter
- Apply to own posting (should fail)
- Duplicate application (should fail)
- List all applications
- Filter by PAPS/applicant
- Get application details
- Update cover letter
- Accept/reject application
- Withdraw application

### Assignments - ASAP (7 tests)
- Create assignment from accepted SPAP
- List all assignments
- Filter by PAPS/worker
- Get assignment details
- Update status (pending → in_progress → completed)
- Auto-payment on completion
- Media upload for proof of work

### Payments (6 tests)
- Get payments for PAPS
- Create manual payment
- Get payment details
- Update payment status
- Get user payments (payer/payee)
- Filter by role
- Verify auto-payment creation

### Ratings (5 tests)
- Create rating for completed job
- Get user ratings (average/total)
- Get specific rating details
- Update rating
- Invalid rating value (should fail)

### Comments (7 tests)
- Post comment on PAPS
- List all comments
- Post reply (threaded)
- Get comment with replies
- Update comment
- Delete comment (soft delete)
- Pagination

### Chat (12 tests)
- Get user's chat threads
- Get specific thread details
- Get thread messages
- Send message
- **Edit message** (only sender can edit)
- **Edit non-owner message (should fail)**
- **Edit empty content (should fail)**
- Mark message as read
- Mark all messages as read
- Get unread count
- Get participants
- Leave thread

### Full Workflow Test (14 steps)
Complete end-to-end scenario:
1. Register job poster
2. Register worker
3. Get authentication tokens
4. Update both profiles
5. Post job with payment
6. Worker applies with cover letter
7. Poster accepts application
8. Create assignment
9. Worker starts work
10. Poster marks complete (triggers auto-payment)
11. Verify payment created
12. Mark payment complete
13. Poster rates worker
14. Worker rates poster

### Cleanup Tests
- Delete in correct order (payments → PAPS → users)
- Verify constraint enforcement
- Test deletion permissions

## Output Format

```
========================================
SYSTEM & HEALTH CHECK ROUTES
========================================

[TEST 1] GET /uptime - Health check
✓ PASS: Health check successful (Status: 200)
  Uptime: 0:02:15.123456

[TEST 2] GET /info - Without authentication (should fail)
✓ PASS: Info requires authentication (Status: 401)

...

========================================
TEST SUMMARY
========================================
Total Tests:  107
Passed:       105
Failed:       2
Success Rate: 98%
========================================
```

## Color Codes

- 🟦 **Blue**: Headers and section titles
- 🟨 **Yellow**: Test descriptions
- 🟢 **Green**: Passed tests
- 🟥 **Red**: Failed tests

## Test Data

The script creates:
- 2+ test users (poster and worker)
- 3+ job postings (draft, published, completed)
- 2+ applications
- 1+ assignment
- 2+ payments (manual and auto-created)
- 2+ ratings (bidirectional)
- 3+ comments (with replies)
- 1+ category

All test data uses random strings to avoid conflicts.

## Error Handling

The script tests:
- Invalid input validation (email, phone, coordinates)
- Duplicate entries (username, email, applications)
- Authorization failures (not owner, not admin)
- Business logic violations (apply to own job)
- Constraint violations (delete order)
- Missing resources (404 errors)

## Debugging

If tests fail:

```bash
# Check server logs
tail -f app.log

# Verify database
psql underboss -c "SELECT * FROM \"USER\";"

# Check specific endpoint manually
curl -v http://localhost:5000/info \
  -H "Authorization: Bearer <token>"

# Run single section by modifying script
# Comment out unwanted test functions in main()
```

## CI/CD Integration

```yaml
# Example GitHub Actions
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v2
    - name: Setup Database
      run: |
        sudo apt-get install postgresql
        createdb underboss
        make .postgres
    - name: Start Server
      run: make running &
    - name: Run Tests
      run: |
        chmod +x comprehensive_test.sh
        ./comprehensive_test.sh
```

## Performance

- **Duration**: ~2-3 minutes for full suite
- **Requests**: 100+ API calls
- **Database**: Creates/deletes ~50 records
- **Network**: All requests to localhost

## Maintenance

Update test script when:
- New endpoints added
- New parameters added
- New validation rules
- New error codes
- Schema changes

## Limitations

- Does not test file uploads (binary data)
- Does not test WebSocket connections
- Does not test concurrent requests
- Does not test rate limiting
- Uses synchronous requests only

## Related Documentation

- [API Routes Reference](docs/routes.md)
- [Project Documentation](docs/README.md)
- [Python Test Suite](test.py)

## Support

For issues with the test script:
1. Check server is running: `curl http://localhost:5000/uptime`
2. Verify jq installed: `jq --version`
3. Check database connection: `psql underboss -c "SELECT 1;"`
4. Review server logs: `tail -f app.log`

---

**Last Updated**: 2026-01-27  
**Script Version**: 1.0.0  
**Total Tests**: 107
