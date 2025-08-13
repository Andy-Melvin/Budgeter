#!/bin/bash

# Mobile Development Script for Budgeter App
# This script helps you build and sync your app for mobile development

echo "🚀 Budgeter Mobile Development Script"
echo "====================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Function to build and sync
build_and_sync() {
    echo "📦 Building the app..."
    npm run build
    
    if [ $? -eq 0 ]; then
        echo "✅ Build successful!"
        echo "🔄 Syncing with iOS..."
        npx cap sync ios
        
        if [ $? -eq 0 ]; then
            echo "✅ Sync successful!"
            echo "📱 Opening in Xcode..."
            npx cap open ios
        else
            echo "❌ Sync failed!"
            exit 1
        fi
    else
        echo "❌ Build failed!"
        exit 1
    fi
}

# Function to run with live reload
run_live_reload() {
    echo "🔄 Starting live reload development..."
    echo "📱 This will open the app in iOS Simulator with live reload"
    npx cap run ios --livereload --external
}

# Function to check prerequisites
check_prerequisites() {
    echo "🔍 Checking prerequisites..."
    
    # Check if Xcode is installed
    if ! command -v xcodebuild &> /dev/null; then
        echo "❌ Xcode is not installed. Please install Xcode from the Mac App Store."
        return 1
    fi
    
    # Check if CocoaPods is installed
    if ! command -v pod &> /dev/null; then
        echo "❌ CocoaPods is not installed. Please run: sudo gem install cocoapods"
        return 1
    fi
    
    echo "✅ Prerequisites check passed!"
    return 0
}

# Main script logic
case "$1" in
    "build")
        build_and_sync
        ;;
    "live")
        run_live_reload
        ;;
    "check")
        check_prerequisites
        ;;
    "sync")
        echo "🔄 Syncing with iOS..."
        npx cap sync ios
        ;;
    "open")
        echo "📱 Opening in Xcode..."
        npx cap open ios
        ;;
    *)
        echo "Usage: $0 {build|live|check|sync|open}"
        echo ""
        echo "Commands:"
        echo "  build  - Build the app and sync with iOS"
        echo "  live   - Start live reload development"
        echo "  check  - Check if prerequisites are installed"
        echo "  sync   - Sync changes with iOS"
        echo "  open   - Open the project in Xcode"
        echo ""
        echo "Examples:"
        echo "  $0 build    # Build and sync"
        echo "  $0 live     # Start live reload"
        echo "  $0 check    # Check prerequisites"
        ;;
esac 