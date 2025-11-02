# Security Incident Response Runbook

## 🚨 Emergency Contacts
- **Primary Admin**: [Configure wallet address]
- **Backup Admin**: [Configure wallet address]
- **Escalation**: Security team email/Discord

---

## Critical Security Incidents

### 1. Unauthorized Access Detected

**Detection Signs:**
- Failed admin authentication attempts in logs
- Unusual admin action patterns
- Rate limit exceeded events from suspicious wallets

**Immediate Actions:**
1. Check `admin_action_logs` for suspicious activity:
   ```sql
   SELECT * FROM admin_action_logs 
   WHERE created_at > NOW() - INTERVAL '1 hour'
   ORDER BY created_at DESC;
   ```

2. If breach confirmed, **immediately**:
   - Rotate `WALLET_AUTH_SECRET`
   - Check `user_roles` table for unauthorized admin grants
   - Review all recent lottery draws

3. Disable test mode if enabled unexpectedly
4. Audit all withdrawal requests in last 24 hours

**Recovery:**
- Review and fix RLS policies if bypassed
- Implement additional MFA for critical operations
- Increase rate limits to more restrictive values

---

### 2. Large Unauthorized Withdrawal

**Detection Signs:**
- Withdrawal request without matching admin approval
- Transaction to unknown wallet address
- Withdrawal amount exceeds expected range

**Immediate Actions:**
1. Query recent withdrawals:
   ```sql
   SELECT * FROM withdrawal_requests 
   WHERE status = 'completed' 
   AND created_at > NOW() - INTERVAL '1 hour';
   ```

2. Check Solana explorer for transaction details
3. If fraudulent, contact Solana validator to attempt reversal (limited window)

**Prevention:**
- Implement multi-signature requirement for large amounts
- Add time delays for withdrawals over threshold
- Require additional wallet signature for admin withdrawals

---

### 3. Lottery Draw Manipulation

**Detection Signs:**
- Draw completed outside normal schedule
- Winner selection appears non-random
- Test mode lottery on mainnet

**Immediate Actions:**
1. Query suspicious draw:
   ```sql
   SELECT * FROM lottery_draws 
   WHERE status = 'completed' 
   AND completed_at > NOW() - INTERVAL '1 hour';
   ```

2. Verify all ticket purchases had on-chain transactions
3. Check if draw occurred during test mode
4. Review admin action logs for draw trigger

**Recovery:**
- If fraudulent, mark draw as void
- Refund all participants
- Conduct new fair draw
- Publish transparency report

---

### 4. Rate Limit Bypass Attempt

**Detection Signs:**
- Multiple rate limit exceeded events
- Requests from same wallet through different IPs
- Suspicious patterns in admin_action_logs

**Immediate Actions:**
1. Identify attacking wallet:
   ```sql
   SELECT wallet_address, COUNT(*) as attempts
   FROM admin_action_logs
   WHERE created_at > NOW() - INTERVAL '1 hour'
   GROUP BY wallet_address
   HAVING COUNT(*) > 50;
   ```

2. Temporarily block wallet in `user_roles` or add to blocklist table
3. Tighten rate limits if needed

---

## Database Backup & Recovery

### Automated Backups
Lovable Cloud automatically backs up:
- All database tables (every 6 hours)
- Point-in-time recovery available (7 days)

### Manual Backup Before Critical Operations

**Before mainnet launch:**
```bash
# Use Lovable Cloud UI:
1. Go to Backend → Database → Backups
2. Create manual snapshot
3. Name: "pre-mainnet-launch-YYYY-MM-DD"
```

**Critical tables to monitor:**
- `lottery_draws` - All draw data
- `lottery_winners` - Payout records
- `lottery_tickets` - Proof of purchase
- `withdrawal_requests` - Financial transactions
- `referral_earnings` - User balances

### Recovery Procedures

**Restore from backup:**
1. Open Lovable Cloud backend
2. Navigate to Backups
3. Select backup timestamp
4. **WARNING**: This will overwrite current data
5. Verify integrity after restore

**Partial table recovery:**
If only one table is compromised, export backup data and reimport specific table.

---

## Monitoring & Alerts

### Real-Time Monitoring

**Edge Function Logs:**
- Critical events automatically logged with 🚨 emoji
- Check logs for security events:
  - `LOTTERY_DRAW`
  - `TEST_MODE_TOGGLE`
  - `LARGE_WITHDRAWAL`
  - `UNAUTHORIZED_ACCESS`

**Set up external monitoring:**
1. Configure webhook in production for critical events
2. Send to PagerDuty/Sentry/DataDog
3. Alert on:
   - Any `level: 'critical'` event
   - Rate limit exceeded > 10 times/hour
   - Failed admin auth attempts > 5/hour

### Daily Security Checklist

**Every 24 hours:**
- [ ] Review admin_action_logs for anomalies
- [ ] Check all completed lottery draws
- [ ] Verify withdrawal_requests match expected patterns
- [ ] Confirm no unauthorized user_roles entries
- [ ] Review rate limit exceeded events

**Query for daily audit:**
```sql
-- Admin actions last 24h
SELECT action_type, COUNT(*), MAX(created_at)
FROM admin_action_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY action_type;

-- Completed draws
SELECT lottery_type, COUNT(*)
FROM lottery_draws
WHERE status = 'completed' 
AND completed_at > NOW() - INTERVAL '24 hours'
GROUP BY lottery_type;

-- Withdrawal volume
SELECT SUM(amount_lamports) / 1000000000.0 as total_sol
FROM withdrawal_requests
WHERE status = 'completed'
AND created_at > NOW() - INTERVAL '24 hours';
```

---

## Network Switch Protocol

### Mainnet Launch Checklist

**Before switching from devnet to mainnet:**

1. **Verify Secrets:**
   - [ ] All three lottery private keys set
   - [ ] WALLET_AUTH_SECRET is cryptographically secure
   - [ ] Test wallet signatures on devnet

2. **Code Review:**
   - [ ] Network configuration pulls correct RPC endpoint
   - [ ] All edge functions use `getNetworkConfig()`
   - [ ] No hardcoded devnet endpoints remain

3. **Database State:**
   - [ ] Create backup labeled "pre-mainnet"
   - [ ] Clear test data or mark with `test_mode = true`
   - [ ] Verify RLS policies are production-ready

4. **Test Mode:**
   - [ ] Ensure test mode is OFF (`test_mode = false` in settings)
   - [ ] Verify frontend shows mainnet indicator
   - [ ] Test one small transaction on mainnet

5. **Communication:**
   - [ ] Announce mainnet launch to users
   - [ ] Document rollback procedure
   - [ ] Have support channel ready

### Rollback to Devnet

If issues occur on mainnet:
1. Use admin panel to toggle test mode ON
2. Verify all new transactions go to devnet
3. Investigate issue in logs
4. Fix and retest before disabling test mode

---

## Post-Incident Actions

**After any security incident:**

1. **Document:**
   - What happened
   - How it was detected
   - Timeline of events
   - Resolution steps taken

2. **Update:**
   - This runbook with lessons learned
   - Rate limits if needed
   - Monitoring thresholds

3. **Communicate:**
   - Transparency report to users (if user-impacting)
   - Internal post-mortem
   - Update security documentation

4. **Improve:**
   - Add tests for incident scenario
   - Implement additional safeguards
   - Schedule follow-up security review

---

## External Security Audit

**Before mainnet production launch:**

Recommended firms for blockchain security:
- **Trail of Bits** - Smart contract & Web3 audits
- **Kudelski Security** - Full-stack blockchain security
- **OpenZeppelin** - Solana program audits
- **Halborn** - Web3 security specialists

**Audit scope should include:**
- Edge function authorization flows
- RLS policy effectiveness
- Private key handling
- Withdrawal verification logic
- Admin access controls
- Rate limiting implementation

---

## Contact Information

**For Security Issues:**
- Email: [Configure security email]
- Discord: [Configure Discord server]
- Emergency: [Configure emergency contact]

**Lovable Cloud Support:**
- Dashboard: https://lovable.dev
- Docs: https://docs.lovable.dev

**Last Updated:** [Auto-generated on creation]
**Next Review:** [30 days from creation]
