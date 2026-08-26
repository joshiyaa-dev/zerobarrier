#!/usr/bin/env python3
"""
Install offline Argos Translate language packages for English <-> Tamil.
This is optional and requires a C++ compiler to build dependencies.
"""

import sys


def main():
    print("\n[Translation] Attempting to install offline translation packages...")
    print("[Note] This requires a C++ compiler and is optional.")
    
    try:
        from argostranslate import package

        print("[Translation] Installing English <-> Tamil translation...")
        package.update_package_index()

        def install_pair(from_code, to_code):
            available = package.get_available_packages()
            target = next((p for p in available if p.from_code == from_code and p.to_code == to_code), None)
            if not target:
                print(f"[warn] package not found: {from_code}->{to_code}")
                return

            path = target.download()
            package.install_from_path(path)
            print(f"[ok] installed: {from_code}->{to_code}")

        install_pair("en", "ta")
        install_pair("ta", "en")
        print("[ok] Translation packages installed!")

    except ImportError:
        print("[warn] argostranslate not installed (requires C++ compiler)")
        print("[info] Translation is optional; app will still work without it")
        sys.exit(0)
    except Exception as e:
        print(f"[warn] Translation setup failed: {e}")
        print("[info] Translation is optional; app will still work without it")
        sys.exit(0)


if __name__ == "__main__":
    main()

