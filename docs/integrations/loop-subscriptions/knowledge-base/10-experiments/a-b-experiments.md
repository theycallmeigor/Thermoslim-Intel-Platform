---
title: "A/B experiments"
source_url: "https://help.loopwork.co/en/articles/12959426-a-b-experiments"
collection: "10-experiments"
scraped_at: "2026-03-30T17:43:23.524Z"
tags: ["10-experiments"]
---

Learn how to use A/B experiments in Loop to test different cancellation benefits pages and cancellation offers, so you can confidently roll out the variant that saves the most subscribers.

**A/B experiments** in Loop help you test two versions of the same step like benefits pages or cancellation offers to see which one saves more subscribers. By splitting your audience between a control (A) and a variant (B), tracking key experiment metrics, and defining clear winning criteria, you can confidently roll out the highest-performing content instead of guessing.

In this article, we’ll cover what A/B experiments are, why to use them, where they’re supported today, how to set them up, how they appear to your customers, and how to monitor performance.​  
​

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1854171090/b4a9671fd4a19e937164cf6863c0/ChatGPT+Image+Nov+28%2C+2025%2C+04_26_53+PM.png?expires=1774894500&signature=2bea0f62ef41eda7b90526a0c65c664d5cd4defa8b2ca0ccc131b58a35aed501&req=dSgiEsh5nIFWWfMW1HO4zcbkucRy9WaLY%2BrHWgSOMmxandiJ6xu2nB02c5lg%0AzGQA3xA%2BlZUBDEGKLPQ%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1854171090/b4a9671fd4a19e937164cf6863c0/ChatGPT+Image+Nov+28%2C+2025%2C+04_26_53+PM.png?expires=1774894500&signature=2bea0f62ef41eda7b90526a0c65c664d5cd4defa8b2ca0ccc131b58a35aed501&req=dSgiEsh5nIFWWfMW1HO4zcbkucRy9WaLY%2BrHWgSOMmxandiJ6xu2nB02c5lg%0AzGQA3xA%2BlZUBDEGKLPQ%3D%0A)

* * *

#   
What are A/B experiments?

A/B experiments let you show two different versions of the same step to different subscriber groups and measure which one performs better.

*   **Control group (A)** – your “current” experience.
    
*   **Variant group (B)** – an alternative experience you want to test.
    

When a subscriber enters a flow that has an experiment:

*   They are **randomly assigned** to either **A** or **B** based on the audience split you set.
    
*   Once assigned, they **always see the same group** (A or B) until the experiment ends or you stop it.
    
*   Loop tracks the **key experiment metrics** for each group and uses your **winning criteria** to highlight the best-performing variant.
    

#   
Where can you use A/B experiments in Loop?

As of now, A/B experiments in Loop are available **in Cancellation flows**:

1.  Subscription benefits page
    
2.  Cancellation offers
    

If you’re new to these modules, you may want to first read:

*   [Benefits page](https://help.loopwork.co/en/articles/12710373-benefits-page)
    
*   [Cancellation offers](https://help.loopwork.co/en/articles/12710658-cancellation-offers)  
    ​  
    ​
    

# Why use A/B experiments?

A/B experiments help you answer “what actually works?” instead of guessing.

Popular use-cases for **cancellation benefits pages**:

*   Compare different content formats:
    
    *   Video vs text
        
    *   GIF vs static image
        
    *   Long-form story vs short punchy copy
        
    
*   Test different founder / brand videos:
    
    *   Different intros or hooks
        
    *   Value-focused vs emotional messaging
        
    *   Different tone or benefit sequence to see what connects better
        
    

Popular use-cases for **cancellation offers**:

*   **Gift vs Discount**
    
    *   “Should we offer a gift to save margins, or does a discount save better?”
        
    
*   **Discount A vs Discount B**
    
    *   “Do we really need a higher discount, or can a smaller one achieve similar or better save rates?”
        
    
*   **Gift A vs Gift B**
    
    *   “Which gift actually saves more subscribers?”
        
    

By running experiments instead of one-off changes, you can:

*   Prove which approach **increases save rate**.
    
*   Protect your **margins** by validating whether richer offers are truly worth it.
    
*   Continuously optimize cancellation flows without guesswork.  
    ​
    
    ​
    

# How A/B experiments work?

When you create an experiment (for either benefits or offers), you configure:

*   **Audience split**
    
    *   Decide what percentage of eligible subscribers see Group A vs Group B (e.g. 50/50, 70/30).
        
    *   Loop then randomly assigns each subscriber to a group when they enter the cancellation flow.
        
    
    *   Once assigned to a group, the subscriber always sees that same variant for that step (A or B) until:
        
        *   the experiment automatically completes (based on days/attempts), or
            
        *   you manually stop it.
            
        
    
*   **Customer tags**
    
    *   Loop adds different tags to subscribers in control and variant groups.
        
    
*   **Experiment completion rules**
    
    *   You choose when an experiment should auto-complete using either:
        
        *   Number of days (e.g. run for 14 days), or
            
        *   Number of cancellation attempts (e.g. run for 2,000 attempts).
            
        
    
*   **Winning criteria**
    
    *   You define how much better one variant’s save rate must be to be declared the winner.
        
    *   This is a minimum delta/difference in save rate between A and B.
        
    
    Example (winning criteria = “20% better save rate”):
    
    *   **Case 1:**
        
        *   Control (A) save rate = 10%
            
        *   Variant (B) save rate = 12%
            
        *   Variant B is saving 20% more than A → B is declared the winner.
            
        
    *   **Case 2:**
        
        *   Control (A) save rate = 10%
            
        *   Variant (B) save rate = 11%
            
        *   Variant B is saving 10% more than A → no winner is declared (neither variant is saving at least 20% better than the other).
            
        
    

**A/B experiment based Save rate** is the primary metric:  
​_Number of cancellation attempts that were “saved” / total attempts that saw that step._  
​

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1854254244/aea4a4d4c2f1b5c78c66f815100b/Screenshot+2025-11-28+at+5_24_56%E2%80%AFPM.png?expires=1774894500&signature=9489f5dfdc06e7915153244b08a79ee4b4e371463a11afbb697eb74a6d0119a1&req=dSgiEst7mYNbXfMW1HO4zYP%2BqtWg08DlxY%2ByeZ1n3TMvN5FG7d1iVlzqYuxi%0Acce5qev9XIO62OK7AM4%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1854254244/aea4a4d4c2f1b5c78c66f815100b/Screenshot+2025-11-28+at+5_24_56%E2%80%AFPM.png?expires=1774894500&signature=9489f5dfdc06e7915153244b08a79ee4b4e371463a11afbb697eb74a6d0119a1&req=dSgiEst7mYNbXfMW1HO4zYP%2BqtWg08DlxY%2ByeZ1n3TMvN5FG7d1iVlzqYuxi%0Acce5qev9XIO62OK7AM4%3D%0A)

## A/B experiments for cancellation benefits

Use this when you want to test **different versions of your benefits page** before the exit survey and offers.  
​

**What this experiment covers?**

*   Drawer/page title
    
*   Body content (text, images, videos, GIFs)
    
*   Call-to-action buttons (text + links/actions)
    

You configure both **control (A)** and **variant (B)** side-by-side.  
​

**How to create an A/B experiment for benefits?**

1.  Go to **Loop Admin > Retain > Cancellation flows > Benefits page**.
    
2.  Create or edit the benefits page where you want to run the experiment.
    
3.  In the Experimentation block, click Create experiment.
    
4.  Configure your experiment:
    
    *   **Experiment name** – For example, “Benefits video vs text”.
        
    *   **Audience split** – Set how many subscribers go to A vs B.
        
    *   **Audience tags** – Define/add tags for subscribers included in this experiment.
        
    *   **Experiment completion** – Choose by number of days or cancellation attempts.
        
    *   **Winning criteria** – Set the minimum % difference in save rate needed for a winner.
        
    
5.  Configure content for both groups side-by-side:
    
    *   Control (A): Title, body, CTAs.
        
    *   Variant (B): Alternate title, content, and CTAs.
        
    
6.  Use the side-by-side preview to quickly compare how A and B will look to subscribers.
    
7.  Click Save on the benefits page – this starts the experiment.
    

Once live, subscribers who enter the flow and are eligible for this benefits page are split between A and B according to your audience split.  
​

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1854266495/e724ed6d850f017ae1c35dca23f0/Screenshot+2025-11-28+at+5_30_39%E2%80%AFPM.png?expires=1774894500&signature=3358b74b7b27fe074347a911c4f07c9a8e8dc7e0eb2a00c8295c85a209d374e5&req=dSgiEst4m4VWXPMW1HO4zXMQM%2BKCGaXBqhHg%2B4JO%2B5SO838OZAlXQqlzjf8u%0AF2F5gXwfOp7CNqFO3%2Fc%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1854266495/e724ed6d850f017ae1c35dca23f0/Screenshot+2025-11-28+at+5_30_39%E2%80%AFPM.png?expires=1774894500&signature=3358b74b7b27fe074347a911c4f07c9a8e8dc7e0eb2a00c8295c85a209d374e5&req=dSgiEst4m4VWXPMW1HO4zXMQM%2BKCGaXBqhHg%2B4JO%2B5SO838OZAlXQqlzjf8u%0AF2F5gXwfOp7CNqFO3%2Fc%3D%0A)

## A/B experiments for cancellation offers

Use this when you want to test **what kind of offer saves best** after the exit survey.  
​

**What this experiment covers**

*   Offer drawer title
    
*   Body copy and explanation of the offer
    
*   Type and value of the offer, for example:
    
    *   Gift vs Discount
        
    *   10% off vs 20% off
        
    *   Gift A vs Gift B
        
    
*   CTAs (button text and actions)
    

**How to create an A/B experiment for cancellation offers**

1.  Go to **Loop Admin > Retain > Cancellation flows > Cancellation offers**.
    
2.  Create or edit the cancellation offer set where you want to run the experiment.
    
3.  In the Experimentation block, click Create experiment.
    
4.  Configure your experiment:
    
    *   Experiment name – e.g. “Gift vs 15% discount”.
        
    *   Audience split – Choose how many see A vs B.
        
    *   Audience tags – Tags for subscribers included in the experiment.
        
    *   Experiment completion – By days or cancellation attempts.
        
    *   Winning criteria – Minimum save-rate delta required for a winner.
        
    
5.  Configure control (A) and variant (B) offers side-by-side:
    
    *   Control (A): Your current or baseline offer (e.g. 10% discount).
        
    *   Variant (B): Alternative offer (e.g. free gift, or 15% discount).
        
    
6.  Review the side-by-side preview for both offer variants.
    
7.  Click Save on the offers configuration to start the experiment.
    

Subscribers who reach the offers step in the cancellation flow are split between control and variant groups and see the offer configured for their group.

#   
  
How A/B experiments appear to your customers?

From the subscriber’s perspective:

*   They go through the standard cancellation flow (benefits → reasons → offers).
    
*   Wherever an experiment is configured:
    
    *   They see either version A or version B, not both.
        
    *   The page/drawer looks like a normal benefits page or offer – there’s no “experiment” label shown to them.
        
    
*   If the same subscriber attempts cancellation again while the experiment is active:
    
    *   They will see the same group (A or B) they were previously assigned to, to keep the experience consistent.
        
    

If you run experiments on **both** the benefits page and cancellation offers, the subscriber may be in:

*   Group A or B for the benefits experiment, and
    
*   Group A or B for the offers experiment, independently.
    

# How to view performance of your experiments?

Loop provides a dedicated place to track all experiments.  
​

### Experiments list

1.  Go to **Loop Admin > Tools and Apps > A/B experiments**.
    
2.  Here you’ll see all experiments across:
    
    *   Benefits pages
        
    *   Cancellation offers
        
    
3.  For each experiment, you’ll see:
    
    *   Current status (Active, Completed, Stopped)
        
    *   Type (Benefits / Offers)
        
    *   Start date
        
    *   Completion rule (Days / Attempts)
        
    *   High-level save rate by variant
        
    

### Experiment details page

Click any experiment to open its details screen and see:

*   **Primary metric: Save rate** for each variant (A and B).
    
*   **Number of cancellation attempts** that saw this step, for each variant.
    
*   **Number of saves** for each variant.
    
*   **Day-on-day trends** for attempts and saves to understand how performance evolves over time.
    
*   Which variant (if any) is currently marked as leading or winner based on your winning criteria.
    

### Exporting experiment results

From the experiment details page you can export raw data, including:

*   Subscription IDs included in the experiment.
    
*   Which variant (A or B) they were shown.
    
*   Whether the attempt was saved or moved ahead (i.e. cancellation continued).
    

You can then combine this export with your own analytics, ESP, or BI tools for deeper analysis.

# Experiment completion and what happens post completion

## When does an experiment complete?

An experiment automatically completes when either of your configured completion conditions is met:

*   It has run for the configured number of days, or
    
*   It has reached the configured number of cancellation attempts.
    

You can also manually stop an experiment earlier if needed (for example, if you already see a clear winner or if performance looks poor).  
​

## What customers see after completion?

Once an experiment completes (auto or manual):

*   Control group (A) content starts getting automatically shown to all eligible subscribers for that step (benefits or offers).
    
*   Subscribers no longer see variant B in the storefront experience unless you explicitly choose to continue with B.
    

## What you see in the admin after completion

For 7 days after experiment completion:

*   On the relevant configuration page (Benefits or Cancellation offers), you will still see:
    
    *   Control (A) configuration
        
    *   Variant (B) configuration
        
    
*   You can select which variant you want to continue with as your long-term experience (A or B).
    

After those 7 days:

*   If you haven’t explicitly chosen a variant:
    
    *   Subscribers will continue seeing control (A) content.
        
    *   In the admin, you will only see the control (A) configuration.
        
    *   Content from variant (B) will no longer be visible in the UI.
        
    

You can then either:

*   Continue using control (A), or
    
*   Create a new experiment to test a fresh set of hypotheses.
    

# FAQs

#### Can I run A/B experiments on both benefits and offers at the same time?

Yes. You can run A/B experiments on both benefits and offers at the same time:

*   An experiment on the **benefits page**, and
    
*   A separate experiment on the **cancellation offers**.
    

A subscriber may participate in **both**, but assignment is **independent** for each step. For example, they might see Benefits A + Offer B, depending on random assignment.

#### How are subscribers assigned to control (A) or variant (B)?

Loop uses your **audience split** (for example, 50/50 or 70/30) and **randomly assigns** eligible subscribers to either group when they hit that step of the cancellation flow.

Once a subscriber has been assigned to a group, their assignment is **sticky**: They will **always see the same group** (A or B) on subsequent cancellation attempts while the experiment is active.

#### What happens if neither variant meets the winning criteria?

If the difference in save rate between A and B is **less than your winning criteria** (for example, < 20% improvement):

*   No winner is automatically declared.
    
*   The experiment will still complete once it hits the configured days/attempts.
    
*   On completion, **control (A)** will continue to show to all subscribers unless you explicitly choose to switch to variant B within the 7-day post-completion window.
    

#### Can I stop an experiment before it finishes?

Yes, you can **manually stop** an active experiment from its details page. When you stop an experiment:

*   It is marked as **Completed / Stopped**.
    
*   **Control (A)** becomes the active experience shown to all subscribers for that step.
    
*   Results collected up to that point remain available in the experiment reporting and exports.
    

#### Can I edit the content of a variant once the experiment is live?

You can update the content of control (A) or variant (B), but:

*   Any mid-experiment changes will **affect the interpretation** of your results because performance before and after the edit may differ.
    
*   We recommend:
    
    *   Finalizing copy and creatives **before** starting the experiment.
        
    *   If you want to test a significantly different idea, **complete or stop the current experiment** and start a **new one** with the updated concepts.
        
    

[Explore more FAQs](https://help.loopwork.co/en/collections/16646422-frequently-asked-questions-faqs)

# Need help?

No worries - we're here for you!

If you have any questions or need assistance, feel free to email us at [\[email protected\]](/cdn-cgi/l/email-protection#2b585e5b5b44595f6b4744445b5c445940054844) or chat with us using the support beacon at the bottom right of your screen.

Regards,

Loop Subscriptions Team 🙂

* * *

Related Articles

[

Cancellation flows overview

](https://help.loopwork.co/en/articles/12710173-cancellation-flows-overview)[

Benefits page

](https://help.loopwork.co/en/articles/12710373-benefits-page)[

Cancellation offers

](https://help.loopwork.co/en/articles/12710658-cancellation-offers)[

Personalized swap profiles

](https://help.loopwork.co/en/articles/12817720-personalized-swap-profiles)[

Experiments FAQs

](https://help.loopwork.co/en/articles/12993533-experiments-faqs)
