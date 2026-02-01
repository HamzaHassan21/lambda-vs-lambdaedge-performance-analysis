# AWS Lambda vs Lambda@Edge: Edge Computing Performance Analysis
# Overview

This project investigates the performance and architectural trade-offs between AWS Lambda (regional execution) and AWS Lambda@Edge (edge execution) using a realistic cloud-native use case: geo-personalisation of a static website.

Rather than benchmarking synthetic APIs, the project evaluates how identical request-routing logic behaves when executed:

Centrally in a single AWS region using API Gateway and regional Lambda

Distributed globally across CloudFront edge locations using Lambda@Edge

The primary objective is to critically evaluate when edge computing provides meaningful performance benefits, and when a regional serverless architecture remains more appropriate.

The analysis focuses on:

Latency and Time To First Byte (TTFB)

Cold start behaviour

Geographic performance variation

Cache behaviour (HIT vs MISS)

Scalability under increasing load

Observability and monitoring limitations

## Key Features

Geo-personalised static website delivered via Amazon CloudFront

Lambda@Edge viewer-request function rewrites request URIs based on user country

Regional AWS Lambda implementation provides a controlled baseline comparison

Secure architecture using private S3 buckets and CloudFront Origin Access Control (OAC)

Research-aligned testing methodology designed for repeatability and fairness

Explicit acknowledgement of real-world constraints (VPN routing noise, observability limits)

## Architecture
### 1. Lambda@Edge – Edge Execution Architecture

Execution flow:

User → CloudFront → Lambda@Edge (Viewer Request) → S3 Static Content → Response

Lambda@Edge executes at the CloudFront edge location closest to the user

The function reads the CloudFront-Viewer-Country header

The request URI is rewritten to region-specific content, for example:

🇬🇧 GB → uk.html

🇺🇸 US → us.html

🇸🇬 SG → sg.html

🇦🇺 AU → au.html

🌐 Default → index.html

Lambda@Edge does not access S3 directly; it performs request mutation only

CloudFront caching operates on the rewritten URI, enabling edge cache HITs on subsequent requests

S3 remains private and is accessible only through CloudFront using Origin Access Control

Observability note:
CloudWatch logs and metrics for Lambda@Edge are centralised, delayed, and aggregated, limiting fine-grained latency analysis at individual edge locations.

### 2. Regional AWS Lambda – Baseline Architecture

Execution flow:
[AWS Lambda – regional execution](System-Diagram/Lambda@EDGEFlow.png)  

User → API Gateway → Regional AWS Lambda → Response

All requests are routed to a single AWS region

The same geo-routing logic is implemented for fairness of comparison

The function does not fetch static files; it returns routing metadata

No edge caching is involved

Cold starts and execution duration are fully observable via CloudWatch

This architecture provides a measurable and observable baseline against which Lambda@Edge performance is compared.

## Tools & Technologies

[AWS Lambda – regional execution](https://aws.amazon.com/lambda/)  

[Lambda@Edge – edge execution](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-at-the-edge.html)  

[Amazon CloudFront – CDN + edge compute](https://aws.amazon.com/cloudfront/)  

[Amazon S3 – static website hosting](https://aws.amazon.com/s3/)  

[Amazon API Gateway – regional API entry](https://aws.amazon.com/api-gateway/)  

[Amazon CloudWatch – monitoring & metrics](https://aws.amazon.com/cloudwatch/) 

[VPN – NORDVPN - Geolocation Simulation](https://aws.amazon.com/cloudwatch/) 

[Postman – latency and load simulation](https://www.postman.com/)

[GitHub – documentation and code management](https://github.com/)  

## Testing Methodology

The testing methodology is designed to be repeatable, controlled, and academically defensible.
At the IPD stage, the focus is on prototype validation and experimental design, with full benchmarking planned for the final report.

### 1. Baseline Latency Comparison

Compare Lambda@Edge vs Regional Lambda

Simulate users from:

UK

US

Singapore

Australia

Each test repeated across multiple iterations and cycles

Metrics collected:

Total request latency

Time To First Byte (TTFB)

CloudFront cache status (HIT / MISS)

Statistical analysis planned:

Mean

Median

Standard deviation

Coefficient of variation

⚠️ VPN routing may introduce noise; results are analysed for trends, not absolute precision.

### 2. Cache Behaviour (HIT vs MISS)

Force cache MISS using cache-bypass techniques

Measure:

First-request latency (MISS)

Subsequent-request latency (HIT)

Evaluate CloudFront cache effectiveness after URI rewrite

### 3. Cold Start Analysis

Allow functions to idle for extended periods

Capture:

Cold start indicators (Init Duration where available)

Warm execution behaviour

Compare cold-start visibility and impact between architectures

### 4. Concurrency & Scalability Testing

Planned concurrency levels:

1

10

50

100

Metrics:

P50 latency

P90 latency

P99 latency

Error rates or throttling behaviour

### 5. Geographic Performance Evaluation

Use VPNs to simulate long-distance requests

Acknowledge limitations:

Additional routing layers

VPN endpoint inconsistencies

Focus on relative latency differences, not absolute measurements

## Expected Outcomes
### Lambda@Edge (Edge Execution)

Lambda@Edge is expected to:

Reduce perceived latency for globally distributed users through proximity and caching

Deliver faster repeated responses due to CloudFront edge cache HITs

Be most effective for lightweight, read-heavy workloads such as request routing and static content delivery

Exhibit limited observability, with delayed and centralised CloudWatch logs

### Regional AWS Lambda (Baseline Execution)

Regional Lambda is expected to:

Show increased latency for users far from the deployment region

Exhibit more visible cold-start behaviour

Provide stronger observability and monitoring capabilities

Serve as a stable baseline for evaluating the benefits and trade-offs of edge execution

## Comparative Insight

Overall, the comparison is expected to demonstrate that:

Performance improvements from Lambda@Edge are driven primarily by edge caching and geographic proximity, not raw execution speed

Regional Lambda remains preferable for workloads requiring strong observability, dynamic processing, or non-cacheable logic

Edge computing is most beneficial when architectural conditions align with cacheable, latency-sensitive workloads

## References 

[References](https://github.com/HamzaHassan21/lambda-vs-lambdaedge-performance-analysis/blob/main/References.md)

## Author Hamza Hassan - Final-Year Computer Science Student, Cloud & DevOps Enthusiast

## 📫 Connect with Me
[LinkedIn](https://www.linkedin.com/in/hamzahassan21/)
[Youtube](https://www.youtube.com/channel/UC51JEAEBV8WXwf2ZLROvUJw)

