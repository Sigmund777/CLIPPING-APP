# Auth Testing Playbook

## MongoDB Verification
```
mongosh
use clipforge_db
db.users.find({role: "admin"}).pretty()
db.users.findOne({role: "admin"}, {password_hash: 1})
```
Verify: bcrypt hash starts with `$2b$`, indexes on users.email (unique), login_attempts.identifier, password_reset_tokens.expires_at (TTL).

## API Testing
```
curl -c cookies.txt -X POST http://localhost:8001/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@clipforge.ai","password":"ClipForge2026!"}'
cat cookies.txt
curl -b cookies.txt http://localhost:8001/api/auth/me
```
