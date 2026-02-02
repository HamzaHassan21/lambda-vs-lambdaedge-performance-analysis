# AWS Lambda vs Lambda@Edge: Architectural and Performance Evaluation
## Overview

This project investigates the architectural and performance trade-offs between AWS Lambda (regional execution) and AWS Lambda@Edge (edge execution) using a realistic, cloud-native use case: geo-personalisation of a static website.

Rather than benchmarking synthetic APIs, the project evaluates how identical request-routing logic behaves when executed:

Centrally in a single AWS region using API Gateway and regional AWS Lambda

Distributed globally across CloudFront edge locations using Lambda@Edge

The primary objective is not to assume that edge computing is always superior, but to critically evaluate when Lambda@Edge is justified, and when a regional serverless architecture remains more appropriate.

The analysis focuses on:

Client-perceived latency and Time To First Byte (TTFB)

Cold-start behaviour

Cache behaviour (HIT vs MISS)

Scalability under increasing load

Observability and monitoring trade-offs

Architectural complexity versus operational insight

## Key Features

Geo-personalised static website delivered via Amazon CloudFront

Lambda@Edge viewer-request function rewrites request URIs based on user location

Regional AWS Lambda implementation provides a controlled baseline for comparison

Secure architecture using private Amazon S3 buckets with CloudFront Origin Access Control (OAC)

Research-aligned testing methodology designed for repeatability and fairness

Explicit acknowledgement of real-world constraints (caching effects, observability limits)

## Architecture
### 1. Lambda@Edge – Edge Execution Architecture

#### Execution flow:
![AWS Lambda@Edge](System-Diagrams/Lambda@EDGEFlow.png)

User → CloudFront → Lambda@Edge (Viewer Request) → S3 Static Content → Response

Lambda@Edge executes at the viewer-request phase, before CloudFront’s cache decision

The function reads the CloudFront-Viewer-Country header (or a controlled query-string override during testing)

The request URI is rewritten to region-specific content, for example:

🇬🇧 GB → uk.html

🇺🇸 US → us.html

🇸🇬 SG → sg.html

🇦🇺 AU → au.html

🌐 Default → index.html

Lambda@Edge does not access S3 directly; it performs request mutation only

CloudFront caching operates on the rewritten URI, allowing region-specific content to be cached independently at the edge

The S3 bucket remains private and is accessible only through CloudFront using OAC

#### Observability note:
CloudWatch logs and metrics for Lambda@Edge are centralised, delayed, and aggregated, which limits fine-grained latency analysis at individual edge locations. This limitation is explicitly considered in the evaluation.

### 2. Regional AWS Lambda – Baseline Architecture

#### Execution flow:

![Regional AWS Lambda](System-Diagrams/LambdaRegionalFlow.png)

User → API Gateway → Regional AWS Lambda → Response

All requests are routed to a single AWS region

The same geo-routing logic is implemented to ensure fairness of comparison

The function returns routing metadata rather than fetching static content

No CDN-level caching is involved

Cold starts, execution duration, and invocation behaviour are fully observable via CloudWatch

This architecture provides a measurable and observable baseline against which Lambda@Edge behaviour is evaluated.

## Tools & Technologies

[AWS Lambda – regional execution](https://aws.amazon.com/lambda/)  

[Lambda@Edge – edge execution](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-at-the-edge.html)  

[Amazon CloudFront – CDN and edge compute](https://aws.amazon.com/cloudfront/)  

[Amazon S3 – static website hosting](https://aws.amazon.com/s3/)  

[Amazon API Gateway – regional API entry point](https://aws.amazon.com/api-gateway/)  

[Amazon CloudWatch – monitoring & metrics](https://aws.amazon.com/cloudwatch/) 

[Postman – repeatable latency and concurrency testing](https://www.postman.com/)

[curl – protocol-level timing and header inspection](https://www.curl.com/)

[GitHub – documentation and code management](https://github.com/)


## Testing Methodology

The testing methodology is designed to be controlled, repeatable, and academically defensible.
At the Interim Progression Demonstration (IPD) stage, the emphasis is on prototype validation and experimental design, with full benchmarking planned for the final dissertation.

### 1. Baseline Latency Comparison

Compare Lambda@Edge against Regional Lambda

Requests issued using controlled query-string parameters (e.g. ?country=GB)

Each test repeated across multiple iterations and cycles

Metrics collected:

Total request latency

Time To First Byte (TTFB)

CloudFront cache status (HIT / MISS)

Planned statistical analysis:

Mean

Median

Standard deviation

Coefficient of variation

### 2. Cache Behaviour (HIT vs MISS)

Cache bypass techniques used to force initial cache MISS

Subsequent requests used to observe cache HIT behaviour

Measured:

First-request latency (MISS)

Repeated-request latency (HIT)

Stability of cached responses

This isolates the interaction between edge compute and CDN caching.

### 3. Cold Start Analysis

Functions allowed to idle for extended periods

Comparison of:

Cold-start indicators (Init Duration where observable)

Warm execution behaviour

This highlights differences in visibility and impact of cold starts between architectures.

### 4. Concurrency and Scalability Testing

Planned concurrency levels:

1

10

50

100

Metrics:

P50 latency

P90 latency

P99 latency

Error or throttling behaviour

## Comparative Insight

This project does not claim that edge computing is universally superior.

Instead, it is expected to demonstrate that:

Performance gains from Lambda@Edge are primarily driven by cache proximity and request distribution, not raw execution speed

Regional Lambda provides stronger observability and debugging capabilities

Lambda@Edge is most effective for lightweight, cacheable, read-heavy workloads

Architectural decisions should be guided by workload characteristics, not latency assumptions alone

## Prototype Validation

The following screenshots demonstrate the functional correctness and observable behaviour of the Lambda@Edge-based prototype.

### Lambda@Edge Execution (curl)

The curl output below confirms that Lambda@Edge executes at the viewer-request phase and rewrites the request URI based on the detected country.

![Lambda@Edge curl output](images/lambda-egde/curl-edge-uk-response.png)

Key observations:
- `X-Debug-Country` confirms country detection
- `X-Debug-URI` confirms URI rewriting
- `X-Cache` indicates CloudFront cache behaviour (HIT / MISS)

### Geo-Personalised Content (Browser)

The browser output below demonstrates that the correct region-specific content is served to the client.

![Geo-personalised website output](lambda-edge/browser-uk-version.png)

## Project Status

Core architectures implemented and deployed

Functional correctness validated

Testing framework defined

Full benchmarking and statistical analysis planned for the final report

## Final note

This repository supports the Interim Progression Demonstration (IPD) and represents a stable foundation for the final evaluation of serverless and edge computing trade-offs.

## References 

[References](https://github.com/HamzaHassan21/lambda-vs-lambdaedge-performance-analysis/blob/main/References.md)

## IPD Presentation Video

A recorded presentation explaining the project motivation, architecture, prototype, and testing methodology is available here:

📺 https://youtu.be/XXXXXXXXXXX

## Author Hamza Hassan - Final-Year Computer Science Student, Cloud & DevOps Enthusiast

## 📫 Connect with Me
[LinkedIn](https://www.linkedin.com/in/hamzahassan21/)
[Youtube](https://www.youtube.com/channel/UC51JEAEBV8WXwf2ZLROvUJw)

