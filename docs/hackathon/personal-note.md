---
title: Personal Note
description: A personal reflection on the journey from the CORA Summit in Zagreb to building a GPU-accelerated ACTUS engine and exploring insurance extensions.
category: Hackathon
order: 13
---

# Personal Note

## Where It Began

Starting with nothing — only a basic curiosity and the opportunity to attend the CORA Summit in Zagreb — I began my journey into the ACTUS world. At that moment, the terminology, the structure, and even the way financial contracts were reasoned about were completely new to me.

Everything changed during a breakfast conversation where I received a kind of crash course in ACTUS from Francis Gross and Willi Brammertz. Listening to them explain the reasoning behind the standard, I slowly started to see the elegance and potential behind it. The idea that financial contracts could be described in a structured, algorithmic way immediately resonated with me.

## Recognising the Connection to Insurance

Coming from the insurance domain, I quickly began to recognise similarities. Insurance contracts, just like financial contracts, are fundamentally defined by events, state transitions, obligations, and cashflows. That realisation sparked the thought that the ACTUS approach might also be applicable beyond traditional finance — particularly in the insurance world.

## Choosing a Technical Path

When I later learned about the hackathon, I started thinking about what I could realistically contribute. My background is in software development and software architecture, so I decided to focus on something technical. I could have taken the route of proposing conceptual ideas for insurance extensions to ACTUS, but without a working implementation that would remain theoretical. Instead, I chose a technically challenging path: building something that actually works.

The primary objective therefore became ensuring that the implementation behaves correctly according to the ACTUS definitions for financial contracts. From there, I explored how these concepts could be extended into the insurance domain. In that part of the work, the focus was less on perfect correctness and more on identifying the structural requirements necessary to model insurance contracts within an ACTUS-style framework. Many of those explorations are documented in the chapters that follow, including the challenges encountered along the way.

## What I Learned

Through this process I learned a tremendous amount. The journey required stepping into two unfamiliar worlds at the same time: the financial modelling domain and a new technical architecture to support it. Seeing those two domains gradually come together into a working model is something I am genuinely proud of and gives me a strong sense of achievement.

## Where This Can Go

But this work is not an endpoint. The goal was never only to build a proof-of-concept. The real objective is to explore a path forward where ACTUS can serve as a foundation for insurance modelling as well. The insurance industry has specific needs — particularly the ability to change products, rules, and regulatory requirements quickly and frequently. To address that, I experimented with implementing a Markov graph model and a domain-specific language that allows business rules to be defined without requiring software development. This brings product configuration closer to the business domain and within reach of non-developers.

I hope you can appreciate both the effort and the results presented in this documentation. More importantly, I hope this work can serve as a starting point for further exploration.

**Let's see where this can lead us.**

Frans