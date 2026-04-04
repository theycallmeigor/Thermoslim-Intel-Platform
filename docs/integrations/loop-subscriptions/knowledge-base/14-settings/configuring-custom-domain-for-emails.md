---
title: "Configuring custom domain for emails"
source_url: "https://help.loopwork.co/en/articles/12731671-configuring-custom-domain-for-emails"
collection: "14-settings"
scraped_at: "2026-03-30T17:35:00Z"
tags: ["email", "custom domain", "deliverability", "DNS records"]
---

# Configuring custom domain for emails

Learn how to set up a custom email domain in Loop to send branded emails and enhance trust with professional, authenticated communication.

Custom email domain is the name of your brand or website domain that you use to generate email addresses for your company. By default, Loop sends all emails to your customers using a standard Loop email domain. Now you can interact with your customers using a custom domain which better aligns with your brand.

*Custom domain setting is available exclusively on the Loop Pro plan.*

## Where to find custom domain settings?

This feature is available under **Settings > Notifications > Domain settings** for all users on Pro plan.

## Adding a custom domain

Brands prefer to use a custom email domain because it reinforces their brand identity, builds trust with customers, and improves email deliverability by reducing the chances of messages being marked as spam.

Follow these steps to complete the process.

1.  For adding a new domain, navigate to **Loop > Settings > Notifications > Domain settings**.
2.  In the Domain details section, you can see a list of all added domains along with a chip for the current sending domain.
3.  To add a new domain, click the **"Add new domain"** button.
4.  On the Add new domain page, enter your root domain and subdomain. A preview will be shown to depict how your domain will look in your emails.
5.  Upon clicking Save, DNS records will be generated for your domain. These records need to be added to your domain's DNS settings to complete the domain verification process in the next step.

Using a subdomain acts as a protective layer for your root domain. If there are any issues with email delivery, they won’t directly affect your root domain’s reputation. Since subdomains typically operate on separate IP addresses and mailing infrastructure, email providers treat them independently, making recovery from deliverability issues easier and safer for your main domain.

## Verifying your custom domain

Once you have generated the DNS records for your domain, login to your domain provider’s panel to add these records in your DNS settings. Given below are articles to add DNS records for some popular providers.

*   [Amazon Web Services](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resource-record-sets-creating.html)
*   [Cloudflare](https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records)
*   [Google Domains](https://support.google.com/a/answer/48090?hl=en)
*   [GoDaddy](https://in.godaddy.com/help/add-a-cname-record-19236)
*   [Squarespace](https://support.squarespace.com/hc/en-us/articles/205812348-Accessing-your-Squarespace-managed-domain-s-DNS-settings)
*   [HostGator](https://www.hostgator.com/help/article/changing-dns-records)
*   [DreamHost](https://help.dreamhost.com/hc/en-us/articles/360035516812-Adding-custom-DNS-records)
*   [NameCheap](https://www.namecheap.com/support/knowledgebase/article.aspx/9214/31/cpanel-email-deliverability-tool-spf-and-dkim-records/)

After adding the records in your DNS settings, come back to Loop and click on the **verify** button. It can take up to 72 hours for the DNS records to be verified.

Once all the records are verified, the status of the domain would be changed from Pending to Verified.

You can send a test email to check that emails from Loop will correctly reflect the verified custom domain.

## Type of records

To verify and authenticate your custom email domain, the following DNS records must be added. These records ensure your emails are delivered securely and recognized as legitimate by receiving servers.

1.  **DKIM (DomainKeys Identified Mail)**: DKIM helps verify that the email content hasn’t been altered in transit and confirms it was sent from your domain. It prevents spammers from forging your brand's identity. [Read more](https://www.cloudflare.com/en-gb/learning/dns/dns-records/dns-dkim-record/)
2.  **SPF (Sender Policy Framework)**: SPF defines which mail servers are authorized to send emails on behalf of your domain. It helps prevent spoofing and improves deliverability. [Read more](https://www.cloudflare.com/en-gb/learning/dns/dns-records/dns-spf-record/)
3.  **MX (Mail Exchange)**: MX records direct how email should be routed for your domain. They specify which mail servers handle incoming emails for your domain. [Read more](https://www.cloudflare.com/en-gb/learning/dns/dns-records/dns-mx-record/)

## DMARC authentication

To fully secure your custom email domain, setting up a DMARC (Domain-based Message Authentication, Reporting & Conformance) policy is strongly advised. DMARC protects your domain against spoofing and phishing by instructing receiving servers how to handle unauthenticated emails. Email providers like [Google](https://support.google.com/a/answer/81126?visit_id=638470564859520564-1463162014) and [Yahoo](https://blog.postmaster.yahooinc.com/post/730172167494483968/more-secure-less-spam) now require DMARC for bulk senders.
Use this [Google guide](https://support.google.com/a/answer/10032169?sjid=17132811407889532549-NA#policy-options) to configure your DMARC settings effectively.

**Why does it matter?** Implementing DKIM, SPF, and DMARC significantly boosts your email credibility. If these protocols fail, emails may be rejected or sent to spam by receiving servers.

## Changing sender email and domain

Follow these steps to complete the process.

1.  Once you have added and verified your custom domain, you will be able to choose it as a sending domain in the Email settings section.
2.  You can enter your desired sender email address and choose the sender domain from the drop-down menu.
3.  You will also be able to change the reply-to email that is embedded in the email headers.

## FAQs

**How do I verify my DNS records while adding a domain for sending notifications?**
When DNS records are added while adding custom domain in the notifications settings, they are verified automatically once you have added the expected values in the fields. Sometimes, the verification can take 2-3 days as well in unique cases.

**While setting up Custom domain, we are getting 'Enter valid mail server' error. We entered: `10 feedback-smtp.us-east-1.ar`**
If you are adding `10 feedback-smtp.us-east-1.ar` to the Custom domain and getting an error, please know that the '10', goes into priority field and the mail server starts with `feedback-`.

**In the notification domain, is it possible to replace 'noreply' with something else?**
By default, Loop sends email notifications from a no-reply address under our standard domain. However, if you'd like to use your own custom email domain for sending these notifications, that is absolutely possible by configuring a custom domain.
