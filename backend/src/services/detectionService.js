class DetectionService {
    constructor() {
        this.patterns = {
            IGNORE_INSTRUCTIONS: {
                patterns: [
                    /ignore\s+(all\s+)?(previous\s+)?(instructions?|prompts?|rules?)/i,
                    /disregard\s+(all\s+)?(previous\s+)?(instructions?|prompts?)/i,
                    /forget\s+(all\s+)?(previous\s+)?(instructions?|prompts?)/i,
                    /skip\s+(all\s+)?(previous\s+)?(instructions?|prompts?)/i
                ],
                severity: 'SEV-1',
                confidence: 0.9,
                description: 'Attempt to bypass system instructions'
            },
            BYPASS_RULES: {
                patterns: [
                    /bypass\s+(all\s+)?(safety|security|rules?|guidelines?)/i,
                    /override\s+(all\s+)?(safety|security|rules?)/i,
                    /disable\s+(all\s+)?(safety|security|filters?)/i,
                    /ignore\s+(all\s+)?(safety|security|guardrails?|compliance)/i,
                    /circumvent\s+(all\s+)?(safety|security)/i
                ],
                severity: 'SEV-1',
                confidence: 0.95,
                description: 'Attempt to bypass safety mechanisms'
            },
            SYSTEM_PROMPT_EXTRACTION: {
                patterns: [
                    /reveal\s+(your\s+)?(system\s+)?(prompt|instructions?)/i,
                    /show\s+(me\s+)?(your\s+)?(system\s+)?(prompt|instructions?)/i,
                    /what\s+(is|are)\s+(your\s+)?(system\s+)?(prompt|instructions?)/i,
                    /display\s+(your\s+)?(system\s+)?(prompt|instructions?)/i,
                    /print\s+(your\s+)?(system\s+)?(prompt|instructions?)/i,
                    /output\s+(your\s+)?(system\s+)?instructions?/i
                ],
                severity: 'SEV-1',
                confidence: 0.85,
                description: 'Attempt to extract system prompt'
            },
            API_KEY_EXTRACTION: {
                patterns: [
                    /reveal\s+(your\s+)?(api\s+)?(key|token|secret|credential)/i,
                    /show\s+(me\s+)?(your\s+)?(api\s+)?(key|token|secret)/i,
                    /what\s+(is|are)\s+(your\s+)?(api\s+)?(key|token|secret)/i,
                    /give\s+(me\s+)?(your\s+)?(api\s+)?(key|token|secret)/i
                ],
                severity: 'SEV-1',
                confidence: 0.95,
                description: 'Attempt to extract API keys or credentials'
            },
            ROLE_INJECTION: {
                patterns: [
                    /you\s+are\s+now\s+(a|an|no\s+longer)/i,
                    /act\s+as\s+(a|an)\s+(hacker|attacker)/i,
                    /pretend\s+(to\s+be|you\s+are)\s+(a|an)\s+(hacker|attacker)/i,
                    /roleplay\s+as\s+(a|an)\s+(hacker|criminal)/i,
                    /simulate\s+(a|an)\s+(hacker|attacker)/i
                ],
                severity: 'SEV-2',
                confidence: 0.6,
                description: 'Attempt to manipulate AI role or behavior'
            },
            DATA_EXFILTRATION: {
                patterns: [
                    /dump\s+(all\s+)?(user|customer|patient|employee)?\s*(data|passwords?|credentials?|information)/i,
                    /(select|drop|insert|update|delete)\s+.*\s+from\s+.*\s+(user|password|credential)/i,
                    /execute\s+(sql|query|command)/i,
                    /access\s+(database|production\s+data)/i,
                    /export\s+(all\s+)?(user|customer)\s+data/i
                ],
                severity: 'SEV-1',
                confidence: 0.9,
                description: 'Attempt to exfiltrate sensitive data'
            },
            MALWARE_GENERATION: {
                patterns: [
                    /write\s+(malware|virus|trojan|ransomware|spyware|keylogger)/i,
                    /create\s+(malware|virus|trojan|ransomware|keylogger)/i,
                    /generate\s+(malware|virus|exploit|backdoor)/i,
                    /build\s+(a\s+)?(keylogger|backdoor|rootkit)/i,
                    /code\s+(for\s+)?(malware|virus|keylogger)/i
                ],
                severity: 'SEV-1',
                confidence: 0.95,
                description: 'Request to generate malicious code'
            },
            SYSTEM_TAG_INJECTION: {
                patterns: [
                    /<\s*system\s*>/i,
                    /<\s*\/\s*system\s*>/i,
                    /<\s*admin\s*>/i,
                    /<\s*root\s*>/i,
                    /\[SYSTEM\]/i,
                    /\[ADMIN\]/i
                ],
                severity: 'SEV-1',
                confidence: 0.8,
                description: 'Attempt to inject system-level tags'
            },
            CODE_INJECTION: {
                patterns: [
                    /```\s*python.*os\.system/is,
                    /```\s*javascript.*eval\(/is,
                    /exec\s*\(/i,
                    /eval\s*\(/i,
                    /subprocess\./i
                ],
                severity: 'SEV-2',
                confidence: 0.7,
                description: 'Potential code injection attempt'
            },
            SELF_HARM: {
                patterns: [
                    /how\s+to\s+(seriously\s+)?(hurt|harm|kill|end)\s+(myself|my\s+life)/i,
                    /(fastest|quickest|best)\s+way\s+to\s+(seriously\s+)?(die|hurt\s+myself|harm\s+myself|kill\s+myself)/i,
                    /tell\s+me\s+(the\s+)?(fastest|how\s+to)\s+((wayto|way\s+to)\s+)?(seriously\s+)?(hurt|harm|kill)\s+myself/i,
                    /ways\s+to\s+(commit\s+)?suicide/i,
                    /help\s+me\s+(hurt|harm|kill)\s+myself/i
                ],
                severity: 'SEV-1',
                confidence: 0.95,
                description: 'Self-harm or suicide-related content'
            },
            PERSONAL_DATA_REQUEST: {
                patterns: [
                    /(give|show|provide|reveal)\s+(me\s+)?(all\s+)?personal\s+(data|information)/i,
                    /access\s+(to\s+)?personal\s+(information|data)/i,
                    /(user|customer|patient)\s+data.*?(john|jane|doe|\w+\s+\w+)/i,
                    /personal\s+(information|data)\s+about\s+\w+/i,
                    /all\s+personal\s+data.*stored/i
                ],
                severity: 'SEV-1',
                confidence: 0.9,
                description: 'Unauthorized personal data access attempt'
            },
            PHISHING_GENERATION: {
                patterns: [
                    /write\s+(a\s+)?phishing\s+(email|message)/i,
                    /create\s+(a\s+)?phishing\s+email/i,
                    /generate\s+(a\s+)?phishing/i,
                    /pretend\s+to\s+be\s+(a\s+)?(bank|company|support)/i,
                    /fake\s+(email|message)\s+from\s+(bank|paypal|amazon)/i
                ],
                severity: 'SEV-1',
                confidence: 0.95,
                description: 'Phishing content generation attempt'
            },
            SOCIAL_ENGINEERING: {
                patterns: [
                    /ask\s+(me\s+)?for\s+(my\s+)?(password|credentials?|login)/i,
                    /pretend\s+(to\s+be|you\s+are)\s+(a\s+)?(support|help\s+desk|admin)/i,
                    /act\s+as\s+(a\s+)?support\s+agent/i,
                    /request\s+(user\s+)?credentials/i,
                    /helpful\s+support\s+agent.*password/i
                ],
                severity: 'SEV-1',
                confidence: 0.9,
                description: 'Social engineering attack attempt'
            },
            ENVIRONMENT_ACCESS: {
                patterns: [
                    /print\s+(your\s+)?environment\s+variables/i,
                    /show\s+(me\s+)?(your\s+)?runtime\s+(config|configuration)/i,
                    /reveal\s+(your\s+)?environment/i,
                    /display\s+(your\s+)?(env|config|settings)/i,
                    /output\s+(your\s+)?system\s+config/i
                ],
                severity: 'SEV-1',
                confidence: 0.9,
                description: 'Attempt to access environment configuration'
            },
            MULTI_STEP_ATTACK: {
                patterns: [
                    /(first|then)\s+.*\s+(then|ignore|forget|bypass)/i,
                    /explain.*then\s+(ignore|forget|reveal|bypass)/i,
                    /\.\s*then\s+(ignore|bypass|reveal)/i
                ],
                severity: 'SEV-1',
                confidence: 0.85,
                description: 'Multi-step chained attack detected'
            },
            COMPLIANCE_VIOLATION: {
                patterns: [
                    /ignore\s+(compliance|privacy|gdpr|hipaa)/i,
                    /bypass\s+(compliance|privacy\s+rules)/i,
                    /access\s+confidential\s+(customer|internal)\s+data/i,
                    /leak\s+(customer|user|internal)\s+data/i,
                    /confidential\s+internal\s+customer\s+data/i
                ],
                severity: 'SEV-1',
                confidence: 0.9,
                description: 'Compliance or privacy violation attempt'
            }
        };
    }

    detectPromptInjection(prompt) {
        const matchedPatterns = [];
        let highestSeverity = 'SEV-3';
        let totalConfidence = 0;
        let matchCount = 0;

        // Check each pattern category
        for (const [category, config] of Object.entries(this.patterns)) {
            for (const pattern of config.patterns) {
                if (pattern.test(prompt)) {
                    matchedPatterns.push(category);

                    // Update severity (SEV-1 is highest priority)
                    if (config.severity === 'SEV-1' ||
                        (config.severity === 'SEV-2' && highestSeverity === 'SEV-3')) {
                        highestSeverity = config.severity;
                    }

                    totalConfidence += config.confidence;
                    matchCount++;
                    break; // Only count each category once
                }
            }
        }

        // Remove duplicates while preserving order
        const uniquePatterns = [...new Set(matchedPatterns)];

        // Calculate average confidence
        const averageConfidence = matchCount > 0 ? totalConfidence / matchCount : 0;

        return {
            isMalicious: uniquePatterns.length > 0,
            matchedPatterns: uniquePatterns,
            severity: highestSeverity,
            confidence: Math.min(averageConfidence, 1.0),
            description: uniquePatterns.length > 0
                ? uniquePatterns.map(p => this.patterns[p].description).join('; ')
                : 'No threats detected'
        };
    }
}

export default new DetectionService();
