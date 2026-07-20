const fs = require('fs');
const content = fs.readFileSync('hooks/useSocial.ts', 'utf-8');

const lines = content.split('\n');

const typesLines = [];
const followersLines = [];
const timelineLines = [];
const publicLines = [];
const reviewsLines = [];

let currentSection = 'types';

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('// FOLLOWERS / FOLLOWING')) {
        currentSection = 'followers';
    } else if (line.includes('// TIMELINE / FEED')) {
        currentSection = 'timeline';
    } else if (line.includes('// PUBLIC PROFILE')) {
        currentSection = 'public';
    } else if (line.includes('// COMMUNITY REVIEWS & STATS')) {
        currentSection = 'reviews';
    }
    
    if (currentSection === 'types') {
        typesLines.push(line);
    } else if (currentSection === 'followers') {
        followersLines.push(line);
    } else if (currentSection === 'timeline') {
        timelineLines.push(line);
    } else if (currentSection === 'public') {
        publicLines.push(line);
    } else if (currentSection === 'reviews') {
        reviewsLines.push(line);
    }
}

const imports = typesLines.filter(line => line.startsWith('import'));
const typesContent = typesLines.filter(line => !line.startsWith('import')).join('\n');

fs.writeFileSync('hooks/useSocialTypes.ts', imports.join('\n') + '\n' + typesContent);

function writeFile(name, contentLines) {
    let out = "import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';\n";
    out += "import { supabase } from '@/lib/supabase';\n";
    out += "import { Profile, ReviewComment, BookStats, CommunityReview, TimelineItem, FeedItem } from './useSocialTypes';\n";
    out += "import { BookItem } from '@/lib/openLibrary';\n";
    out += contentLines.join('\n');
    fs.writeFileSync(`hooks/${name}.ts`, out);
}

writeFile('useFollowers', [...followersLines, ...publicLines]);
writeFile('useTimeline', timelineLines);
writeFile('useCommunityReviews', reviewsLines);

let indexContent = "export * from './useSocialTypes';\n";
indexContent += "export * from './useFollowers';\n";
indexContent += "export * from './useTimeline';\n";
indexContent += "export * from './useCommunityReviews';\n";
fs.writeFileSync('hooks/useSocial.ts', indexContent);

console.log('Split complete');
