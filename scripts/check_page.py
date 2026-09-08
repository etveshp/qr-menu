from playwright.sync_api import sync_playwright
import sys

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()
    page.on("console", lambda msg: print(f"CONSOLE: {msg.type}: {msg.text}", file=sys.stderr))
    page.on("pageerror", lambda err: print(f"PAGE_ERROR: {err}", file=sys.stderr))
    page.goto("http://localhost:3000")
    page.wait_for_load_state("networkidle", timeout=15000)
    spinner = page.locator(".animate-spin")
    if spinner.count() > 0:
        page.wait_for_timeout(3000)
        if spinner.count() > 0 and spinner.first.is_visible():
            print("FAIL: Spinner still visible after 3s")
            browser.close()
            sys.exit(1)
    print("PASS: Page loaded, spinner gone")
    print(f"Title: {page.title()}")
    browser.close()