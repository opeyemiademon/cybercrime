import { makeExecutableSchema } from '@graphql-tools/schema';
import userTypeDefs from './modules/user/user.typeDefs.js';
import userResolvers from './modules/user/user.resolvers.js';
import caseTypeDefs from './modules/case/case.typeDefs.js';
import caseResolvers from './modules/case/case.resolvers.js';
import evidenceTypeDefs from './modules/evidence/evidence.typeDefs.js';
import evidenceResolvers from './modules/evidence/evidence.resolvers.js';
import custodyLogTypeDefs from './modules/custodylog/custodylog.typeDefs.js';
import custodyLogResolvers from './modules/custodylog/custodylog.resolvers.js';
import forensicReportTypeDefs from './modules/forensicreport/forensicreport.typeDefs.js';
import forensicReportResolvers from './modules/forensicreport/forensicreport.resolvers.js';
export const schema = makeExecutableSchema({
    typeDefs: [
        userTypeDefs,
        caseTypeDefs,
        evidenceTypeDefs,
        custodyLogTypeDefs,
        forensicReportTypeDefs
    ],
    resolvers: [
        userResolvers,
        caseResolvers,
        evidenceResolvers,
        custodyLogResolvers,
        forensicReportResolvers
    ]
});
//# sourceMappingURL=schema.js.map