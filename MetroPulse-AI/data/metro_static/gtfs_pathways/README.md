# DMRC Accessibility Data in GTFS Pathways Format

This directory contains standardized accessibility data for Delhi Metro stations, converted from Excel templates to GTFS Pathways format. The data focuses on mapping the connections between gates, lifts, and platforms at each station.

## Files Included

- **stops.txt**: Contains all stations, gates, lifts, and platforms as GTFS stops
- **pathways.txt**: Defines the connections between gates, lifts, and platforms
- **levels.txt**: Defines the vertical levels within stations (Ground, Concourse, Platform)

## Data Structure

### Stops (stops.txt)

Each stop has a unique `stop_id` following this pattern:
- Stations: Station code (e.g., `WC` for Welcome station)
- Gates: `STATION_G#` (e.g., `WC_G1` for Gate 1 at Welcome station)
- Lifts: `STATION_L#` (e.g., `WC_L1` for Lift 1 at Welcome station)
- Platforms: `STATION_P#` (e.g., `WC_P1` for Platform 1 at Welcome station)

The `location_type` field indicates the type of stop:
- `1`: Station (parent)
- `2`: Entrance/Exit (gate)
- `3`: Generic Node (lift)
- `0`: Platform

The `parent_station` field links gates, lifts, and platforms to their parent station.

### Pathways (pathways.txt)

Each pathway represents a connection between two stops (gate-lift or lift-platform). The `pathway_mode` field indicates:
- `5`: Elevator (for lift connections)
- `1`: Walkway (for regular walking paths)

All pathways are set as bidirectional (`is_bidirectional=1`).

### Levels (levels.txt)

Three standard levels are defined:
- `L0`: Ground level
- `L1`: Concourse level
- `L2`: Platform level

## Example Usage

This standardized format allows for:

1. **Accessibility routing**: Find accessible paths from station entrances to platforms
2. **Visualization**: Display the connections between gates, lifts, and platforms
3. **Analysis**: Identify stations with insufficient accessibility infrastructure

## Source Data

The data was extracted from Excel templates for various Delhi Metro lines, including:
- Red Line (Line 1)
- Yellow Line (Line 2)
- Pink Line (Line 7)

## GTFS Pathways Specification

This dataset follows the GTFS Pathways specification as defined at:
https://gtfs.org/extensions/pathways/

## Limitations

- Some stations may have incomplete data
- Traversal times and distances are not included
- Exact level assignments for each stop are not included
