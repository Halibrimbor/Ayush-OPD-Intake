# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please **do not** open a public GitHub issue. Instead, please report it responsibly by emailing the project maintainers.

### Security Vulnerability Report

Please include the following information:

1. **Description** - What is the vulnerability?
2. **Location** - Which files/functions are affected?
3. **Impact** - How serious is the vulnerability?
4. **Proof of Concept** - Steps to reproduce (without sensitive data)
5. **Your Contact** - How can we reach you?

### Response Timeline

- We will acknowledge receipt within 48 hours
- We will provide an initial assessment within 7 days
- We will work on a fix and notify you before public disclosure
- Public disclosure will occur after a fix is available

## Security Best Practices

When using this system:

### For Development
- Never commit `.env` files or secrets
- Use strong passwords for local development
- Keep dependencies updated
- Review security warnings in CI/CD

### For Deployment
- Change default credentials
- Use HTTPS/TLS encryption
- Implement proper authentication
- Validate all user inputs
- Use a production database (PostgreSQL)
- Set up regular backups
- Enable audit logging
- Monitor for security updates

### Sensitive Data
- Patient data is sensitive healthcare information
- Implement HIPAA compliance if required
- Use encryption for data at rest and in transit
- Restrict database access
- Implement proper access controls

## Dependencies

We regularly update dependencies to address security vulnerabilities. To check for vulnerabilities:

```bash
# Python
pip install safety
safety check

# Node.js
npm audit
npm audit fix
```

## Disclosure Policy

Once a patch is available, we will:
1. Release a new version
2. Publish a security advisory
3. Credit the reporter (if desired)
4. Update documentation

Thank you for helping keep Ayush OPD Intake System secure!
