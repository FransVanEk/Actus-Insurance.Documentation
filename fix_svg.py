import re

svg_path = r'c:\Users\frans\source\repos\actus\actus-final\Actus-Insurance.Documentation\Actus-Insurance.Documentation\docs\hackathon\car-factory-highway.svg'

with open(svg_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Shift sinks label, sink box, data circles, aggregation text, summary circles,
# and report section down by 61px so sink center aligns with off-ramp center y=441

# SINKS label rect y=305->366, text y=324->385
content = content.replace('x="895" y="305" width="130" height="28"', 'x="895" y="366" width="130" height="28"')
content = content.replace('<text x="960" y="324" text-anchor="middle" fill="#D4891A" font-size="12" font-weight="bold">SINKS</text>',
                          '<text x="960" y="385" text-anchor="middle" fill="#D4891A" font-size="12" font-weight="bold">SINKS</text>')

# Sink box y=345->406
content = content.replace('x="905" y="345" width="110" height="70"', 'x="905" y="406" width="110" height="70"')

# Shift data point circles cy +61
def shift_data_circles(match):
    cy = int(match.group(1))
    return match.group(0).replace(f'cy="{cy}"', f'cy="{cy+61}"')

# Only shift the blue opacity circles inside the sink
content = re.sub(r'<circle cx="\d+" cy="(\d+)" r="2"/>', shift_data_circles, content)

# Aggregation text y=385->446
content = content.replace('<text x="960" y="385" text-anchor="middle" fill="#8FAAB8" font-size="10">avg | spread | risk</text>',
                          '<text x="960" y="446" text-anchor="middle" fill="#8FAAB8" font-size="10">avg | spread | risk</text>')

# Summary circles cy=405->466
content = content.replace('cy="405" r="3.5"', 'cy="466" r="3.5"')

# Straighten arrow: was bent, now straight from off-ramp right edge to sink left edge
content = content.replace('d="M 865 441 L 910 441 L 910 415"', 'd="M 865 441 L 905 441"')

# Arrow to report y1=415->476, y2=430->491
content = content.replace('x1="960" y1="415" x2="960" y2="430"', 'x1="960" y1="476" x2="960" y2="491"')

# Report rect y=430->491
content = content.replace('x="930" y="430" width="60" height="40"', 'x="930" y="491" width="60" height="40"')

# Report lines +61
content = content.replace('x2="980" y2="442"', 'x2="980" y2="503"')
content = content.replace('x1="940" y1="442"', 'x1="940" y1="503"')
content = content.replace('x2="975" y2="450"', 'x2="975" y2="511"')
content = content.replace('x1="940" y1="450"', 'x1="940" y1="511"')
content = content.replace('x2="970" y2="458"', 'x2="970" y2="519"')
content = content.replace('x1="940" y1="458"', 'x1="940" y1="519"')

# Report text y=485->546
content = content.replace('<text x="960" y="485" text-anchor="middle" fill="#FFFFFF" font-size="11" font-weight="bold">Report</text>',
                          '<text x="960" y="546" text-anchor="middle" fill="#FFFFFF" font-size="11" font-weight="bold">Report</text>')

with open(svg_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
