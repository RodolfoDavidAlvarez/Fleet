#!/bin/bash

# Script to rename screenshots with descriptive names
# Based on analysis of fleet management system screenshots

cd "FLEET MANAGEMENT SCREENSHOT (AIRTABLE INTERFACE) AND ONLINE FORMS"

# Create array of new names in chronological order
declare -a new_names=(
    "01-dashboard-overview.png"
    "02-vehicle-list-view.png"
    "03-vehicle-details-form.png"
    "04-booking-calendar-view.png"
    "05-service-request-form.png"
    "06-airtable-interface-main.png"
    "07-airtable-vehicle-database.png"
    "08-booking-interface.png"
    "09-mechanic-assignment-view.png"
    "10-jotform-service-request.png"
    "11-jotform-booking-form.png"
    "12-calendly-booking-interface.png"
    "13-reports-analytics-view.png"
    "14-settings-configuration.png"
)

# Get files sorted by modification time
index=0
for file in $(ls -t *.png 2>/dev/null | head -14); do
    if [ $index -lt ${#new_names[@]} ]; then
        if [ -f "$file" ]; then
            new_name="${new_names[$index]}"
            mv "$file" "$new_name" 2>/dev/null && echo "Renamed: $file -> $new_name" || echo "Failed: $file"
            ((index++))
        fi
    fi
done

echo "Screenshot renaming complete!"
