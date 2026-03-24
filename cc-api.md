AUTHENTICATION & SETUP
import requests
import json
from datetime import datetime, timedelta

# Configuration
CC_LOGIN_ID = "igor.ai"  # Your CC login
CC_API_KEY = "your_api_key_here"  # From CC dashboard
BASE_URL = "https://api.checkoutchamp.com"
# Common headers/params
API_PARAMS = {
    "loginId": CC_LOGIN_ID,
    "password": CC_API_KEY  # CC uses 'password' field for API key
}


FUNNEL CONVERSION RATES (CR) BY FUNNEL
Step 1: Get All Funnels
def get_all_funnels():
    """Fetch all funnels with their pages and structure"""
    url = f"{BASE_URL}/funnel/list"
    response = requests.get(url, params=API_PARAMS)
    
    if response.status_code == 200:
        data = response.json()
        funnels = data.get("funnels", [])
        
        # Structure: {funnel_id: {name, pages: [{type, title, slug}]}}
        funnel_map = {}
        for funnel in funnels:
            funnel_map[funnel["referenceId"]] = {
                "name": funnel["name"],
                "campaign": funnel.get("campaign"),
                "pages": [
                    {
                        "page_id": page["referenceId"],
                        "title": page["title"],
                        "slug": page.get("urlSlug"),
                        "type": page.get("pageView", [{}])[0].get("pageType"),
                        "external_url": page.get("externalURL")
                    }
                    for page in funnel.get("pages", [])
                ]
            }
        return funnel_map
    return {}


Step 2: Get Orders by Funnel/Page
def get_orders_by_funnel(start_date, end_date):
    """Fetch orders with funnel/page attribution"""
    url = f"{BASE_URL}/order/query"
    
    payload = {
        **API_PARAMS,
        "startDate": start_date.strftime("%m/%d/%Y"),
        "endDate": end_date.strftime("%m/%d/%Y"),
        "limit": 1000  # Max per request
    }
    
    response = requests.post(url, json=payload)
    
    if response.status_code == 200:
        data = response.json()
        if data.get("result") == "SUCCESS":
            orders = data.get("message", {}).get("data", [])
            
            # Extract funnel/page info from each order
            funnel_orders = {}
            for order in orders:
                # Check for funnel/page tracking in order data
                funnel_id = order.get("funnelId") or order.get("campaignId")
                page_id = order.get("pageId") or order.get("landingPageId")
                
                if funnel_id:
                    if funnel_id not in funnel_orders:
                        funnel_orders[funnel_id] = {
                            "orders": [],
                            "revenue": 0,
                            "count": 0
                        }
                    
                    funnel_orders[funnel_id]["orders"].append(order)
                    funnel_orders[funnel_id]["revenue"] += float(order.get("total", 0))
                    funnel_orders[funnel_id]["count"] += 1
            
            return funnel_orders
    return {}


Step 3: Calculate Funnel CR
def calculate_funnel_cr(funnel_orders, page_views_data):
    """
    Calculate conversion rates per funnel
    page_views_data: {funnel_id: {page_id: views_count}} from analytics
    """
    funnel_cr = {}
    
    for funnel_id, order_data in funnel_orders.items():
        total_orders = order_data["count"]
        total_revenue = order_data["revenue"]
        
        # Get page views for this funnel
        funnel_views = page_views_data.get(funnel_id, {}).get("total_views", 0)
        
        if funnel_views > 0:
            cr = (total_orders / funnel_views) * 100
        else:
            cr = 0
        
        funnel_cr[funnel_id] = {
            "conversion_rate": cr,
            "total_orders": total_orders,
            "total_revenue": total_revenue,
            "page_views": funnel_views,
            "aov": total_revenue / total_orders if total_orders > 0 else 0
        }
    
    return funnel_cr


PRODUCT PURCHASE ANALYSIS (Accepted/Upsells)
Step 1: Get Product Catalog
python
def get_product_catalog():
    """Fetch all products with IDs and pricing"""
    url = f"{BASE_URL}/product/list"
    response = requests.get(url, params=API_PARAMS)
    
    if response.status_code == 200:
        data = response.json()
        products = data.get("products", [])
        
        # Map: {product_id: {name, price, type, subscription}}
        product_map = {}
        for product in products:
            product_map[product["id"]] = {
                "name": product.get("name"),
                "price": float(product.get("price", 0)),
                "type": product.get("productType"),  # one-time, subscription
                "subscription_interval": product.get("subscriptionInterval"),
                "is_upsell": "upsell" in product.get("name", "").lower()
            }
        return product_map
    return {}


Step 2: Analyze Order Products
def analyze_product_purchases(orders, product_catalog):
    """Break down what products were purchased, including upsells"""
    
    product_analysis = {
        "by_product": {},
        "upsell_analysis": {
            "accepted": 0,
            "declined": 0,
            "total_offered": 0,
            "acceptance_rate": 0
        },
        "subscription_analysis": {
            "one_time": 0,
            "subscription": 0,
            "recurring_revenue": 0
        }
    }
    
    for order in orders:
        # Check order items
        items = order.get("items", [])
        
        for item in items:
            product_id = item.get("productId")
            quantity = int(item.get("quantity", 1))
            price = float(item.get("price", 0))
            
            if product_id:
                # Initialize product tracking
                if product_id not in product_analysis["by_product"]:
                    product_analysis["by_product"][product_id] = {
                        "name": product_catalog.get(product_id, {}).get("name", "Unknown"),
                        "total_sold": 0,
                        "total_revenue": 0,
                        "quantity_sold": 0,
                        "is_upsell": product_catalog.get(product_id, {}).get("is_upsell", False),
                        "is_subscription": product_catalog.get(product_id, {}).get("type") == "subscription"
                    }
                
                # Update counts
                product_analysis["by_product"][product_id]["total_sold"] += 1
                product_analysis["by_product"][product_id]["total_revenue"] += price
                product_analysis["by_product"][product_id]["quantity_sold"] += quantity
                
                # Track upsells
                if product_analysis["by_product"][product_id]["is_upsell"]:
                    product_analysis["upsell_analysis"]["accepted"] += 1
                
                # Track subscription vs one-time
                if product_analysis["by_product"][product_id]["is_subscription"]:
                    product_analysis["subscription_analysis"]["subscription"] += 1
                    product_analysis["subscription_analysis"]["recurring_revenue"] += price
                else:
                    product_analysis["subscription_analysis"]["one_time"] += 1
        
        # Check for upsell offers in order metadata
        order_metadata = order.get("metadata", {})
        if order_metadata.get("upsell_offered"):
            product_analysis["upsell_analysis"]["total_offered"] += 1
    
    # Calculate upsell acceptance rate
    total_offered = product_analysis["upsell_analysis"]["total_offered"]
    accepted = product_analysis["upsell_analysis"]["accepted"]
    
    if total_offered > 0:
        product_analysis["upsell_analysis"]["acceptance_rate"] = (accepted / total_offered) * 100
    
    return product_analysis


MMR (MONTHLY RECURRING REVENUE) ANALYSIS
Step 1: Calculate Active Subscriptions
def calculate_mmr(subscription_orders):
    """
    Calculate Monthly Recurring Revenue
    subscription_orders: List of subscription orders
    """
    
    # Group by customer and subscription plan
    customer_subscriptions = {}
    
    for order in subscription_orders:
        customer_id = order.get("customerId") or order.get("email")
        product_id = order.get("items", [{}])[0].get("productId")
        price = float(order.get("total", 0))
        interval = order.get("subscriptionInterval", "monthly")
        
        if customer_id and product_id:
            key = f"{customer_id}_{product_id}"
            
            if key not in customer_subscriptions:
                customer_subscriptions[key] = {
                    "customer": customer_id,
                    "product_id": product_id,
                    "price": price,
                    "interval": interval,
                    "last_payment": order.get("createdAt"),
                    "status": order.get("subscriptionStatus", "active")
                }
            else:
                # Update with latest payment
                customer_subscriptions[key]["last_payment"] = order.get("createdAt")
    
    # Calculate MMR
    mmr = 0
    active_subscriptions = 0
    
    for sub in customer_subscriptions.values():
        if sub["status"] == "active":
            active_subscriptions += 1
            
            # Convert to monthly equivalent
            if sub["interval"] == "monthly":
                mmr += sub["price"]
            elif sub["interval"] == "yearly":
                mmr += sub["price"] / 12
            elif sub["interval"] == "weekly":
                mmr += sub["price"] * 4.33  # Approximate weeks in month
            elif sub["interval"] == "daily":
                mmr += sub["price"] * 30  # Approximate days in month
    
    return {
        "mmr": mmr,
        "active_subscriptions": active_subscriptions,
        "customer_subscriptions": customer_subscriptions,
        "avg_revenue_per_subscription": mmr / active_subscriptions if active_subscriptions > 0 else 0
    }


Step 2: Subscription Cohort Analysis
def analyze_subscription_cohorts(orders, days_back=90):
    """Analyze subscription retention by cohort"""
    
    # Filter subscription orders
    subscription_orders = [
        order for order in orders 
        if order.get("subscriptionId") or any(
            item.get("productType") == "subscription" 
            for item in order.get("items", [])
        )
    ]
    
    # Group by month cohort
    cohorts = {}
    
    for order in subscription_orders:
        order_date = datetime.fromisoformat(order.get("createdAt").replace("Z", "+00:00"))
        cohort_key = order_date.strftime("%Y-%m")  # Monthly cohorts
        
        if cohort_key not in cohorts:
            cohorts[cohort_key] = {
                "customers": set(),
                "revenue": 0,
                "orders": []
            }
        
        customer_id = order.get("customerId") or order.get("email")
        if customer_id:
            cohorts[cohort_key]["customers"].add(customer_id)
        
        cohorts[cohort_key]["revenue"] += float(order.get("total", 0))
        cohorts[cohort_key]["orders"].append(order)
    
    # Calculate retention metrics
    cohort_analysis = {}
    for cohort_key, data in cohorts.items():
        total_customers = len(data["customers"])
        
        # Check how many are still active (made order in last 30 days)
        active_customers = 0
        for customer in data["customers"]:
            # Check if this customer has any recent orders
            recent_orders = [
                o for o in subscription_orders 
                if (o.get("customerId") == customer or o.get("email") == customer)
                and (datetime.now() - datetime.fromisoformat(o.get("createdAt").replace("Z", "+00:00"))).days <= 30
            ]
            if recent_orders:
                active_customers += 1
        
        cohort_analysis[cohort_key] = {
            "total_customers": total_customers,
            "active_customers": active_customers,
            "retention_rate": (active_customers / total_customers * 100) if total_customers > 0 else 0,
            "total_revenue": data["revenue"],
            "lifetime_value": data["revenue"] / total_customers if total_customers > 0 else 0
        }
    
    return cohort_analysis


COMPLETE ANALYTICS PIPELINE
def run_complete_cc_analytics(days=30):
    """Complete analytics pipeline for funnel CR, product analysis, and MMR"""
    
    # Date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    print(f"📊 Running CC Analytics for {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
    
    # Step 1: Get all data
    print("1️⃣ Fetching funnels...")
    funnels = get_all_funnels()
    
    print("2️⃣ Fetching orders...")
    orders_data = get_orders_by_funnel(start_date, end_date)
    all_orders = []
    for funnel_orders in orders_data.values():
        all_orders.extend(funnel_orders.get("orders", []))
    
    print("3️⃣ Fetching products...")
    products = get_product_catalog()
    
    # Step 2: Funnel Analysis
    print("4️⃣ Calculating funnel CR...")
    # Note: You need page views data from analytics platform
    # For now, using order count as proxy
    page_views_proxy = {fid: {"total_views": count * 100} for fid, count in orders_data.items()}  # Placeholder
    funnel_cr = calculate_funnel_cr(orders_data, page_views_proxy)
    
    # Step 3: Product Analysis
    print("5️⃣ Analyzing product purchases...")
    product_analysis = analyze_product_purchases(all_orders, products)
    
    # Step 4: MMR Analysis
    print("6️⃣ Calculating MMR...")
    subscription_orders = [
        order for order in all_orders 
        if any(item.get("productType") == "subscription" for item in order.get("items", []))
    ]
    mmr_analysis = calculate_mmr(subscription_orders)
    
    # Step 5: Cohort Analysis
    print("7️⃣ Analyzing subscription cohorts...")
    cohort_analysis = analyze_subscription_cohorts(all_orders)
    
    # Compile final report
    report = {
        "date_range": {
            "start": start_date.isoformat(),
            "end": end_date.isoformat(),
            "days": days
        },
        "summary": {
            "total_orders": len(all_orders),
            "total_revenue": sum(float(o.get("total", 0)) for o in all_orders),
            "total_funnels": len(funnels),
            "active_subscriptions": mmr_analysis["active_subscriptions"],
            "mmr": mmr_analysis["mmr"]
        },
        "funnel_performance": funnel_cr,
        "product_analysis": product_analysis,
        "mmr_analysis": mmr_analysis,
        "cohort_analysis": cohort_analysis,
        "top_products": sorted(
            product_analysis["by_product"].items(),
            key=lambda x: x[1]["total_revenue"],
            reverse=True
        )[:10]
    }
    
    return report

# Run it
if __name__ == "__main__":
    report = run_complete_cc_analytics(days=30)
    
    # Save report
    with open(f"cc_analytics_{datetime.now().strftime('%Y%m%d')}.json", "w") as f:
        json.dump(report, f, indent=2)
    
    print(f"✅ Report saved: {len(report['funnel_performance'])} funnels analyzed")
    print(f"📈 MMR: ${report['summary']['mmr']:.2f}/month")
    print(f"🛒 Top product: {report['top_products'][0][1]['name']} (${report['top_products'][0][1]['total_revenue']:.2f})")
