---
title: "Experiments FAQs"
source_url: "https://help.loopwork.co/en/articles/12993533-experiments-faqs"
collection: "15-faq"
scraped_at: "2026-03-30T17:43:24.641Z"
tags: ["15-faq"]
---



# A/B Experiments

#### How can I target only specific subscribers with an A/B experiment?

When creating the experiment, you can configure **audience tags**:

*   Use tags to **include or identify** the audience you want to analyze.
    
*   Loop also applies **distinct tags for control and variant groups**, so you can segment your subscribers in external tools by which variant they saw (for example, in Klaviyo or your data warehouse).
    

Make sure your cancellation flow conditions are configured so that only the intended audience actually reaches that benefits page or offer.

#### What’s the difference between A/B experiments and regular edits to my benefits/offers?

*   **Regular edits**: You change content for everyone and rely on before/after analysis or intuition.
    
*   **A/B experiments**: You show **two versions at the same time** to comparable audiences and measure:
    
    *   Save rate for A vs B
        
    *   Attempts and saves over time
        
    *   Whether B is statistically better according to your **winning criteria**
        
    

Experiments are the recommended way to make **data-backed decisions** for high-impact steps like cancellation benefits and offers.

#### Why is Experiment \[A/B\] not complete yet, or is it in progress?

The experiment only gets auto-completed once the experiment crosses the experiment completion configuration - number of days or number of cancellation attempts, until then, the experiment shows in the In Progress state.

#### I was running an Experiment and now I am unable to see that experiment. Where did it go?

It is possible that the experiment was auto-completed if the difference in save rates between the two groups met the winning criteria you set. For instance, if the winning criteria were a 20% delta in save rate, and the 30% discount significantly outperformed the 20% discount, the system may have declared a winner and stopped the experiment.

In that case, you will only be able to see the control group (A) content. Content from variant group (B) will no longer be visible.

Also, 'experiment data' can be drawn from Loop > Tools & Apps > Experiments.

* * *

Related Articles

[

Cancellation flows overview

](https://help.loopwork.co/en/articles/12710173-cancellation-flows-overview)[

Personalized swap profiles

](https://help.loopwork.co/en/articles/12817720-personalized-swap-profiles)[

Campaigns FAQs

](https://help.loopwork.co/en/articles/12858135-campaigns-faqs)[

Retain FAQs

](https://help.loopwork.co/en/articles/12858144-retain-faqs)[

A/B experiments

](https://help.loopwork.co/en/articles/12959426-a-b-experiments)
