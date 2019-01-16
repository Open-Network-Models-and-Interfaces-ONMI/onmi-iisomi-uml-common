import {LoggerFactory, LoggerFactoryOptions, LFService, LogGroupRule, LogLevel} from "typescript-logging";
 
// Create options instance and specify 2 LogGroupRules:
// * One for any logger with a name starting with model, to log on debug
// * The second one for anything else to log on info
const options = new LoggerFactoryOptions()
.addLogGroupRule(new LogGroupRule(new RegExp("model.+"), LogLevel.Debug))
.addLogGroupRule(new LogGroupRule(new RegExp(".+"), LogLevel.Debug))
.addLogGroupRule(new LogGroupRule(new RegExp(".+"), LogLevel.Error))
.addLogGroupRule(new LogGroupRule(new RegExp(".+"), LogLevel.Fatal))
.addLogGroupRule(new LogGroupRule(new RegExp(".+"), LogLevel.Trace))
.addLogGroupRule(new LogGroupRule(new RegExp(".+"), LogLevel.Warn))
.addLogGroupRule(new LogGroupRule(new RegExp(".+"), LogLevel.Info));
 
// Create a named loggerfactory and pass in the options and export the factory.
// Named is since version 0.2.+ (it's recommended for future usage)
export const factory = LFService.createNamedLoggerFactory("LoggerFactory", options);