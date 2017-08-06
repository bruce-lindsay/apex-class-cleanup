"use strict";
const jsforce = require('jsforce');
const fs = require('fs.promised');
const handlebars = require('handlebars');
const promptly = require('promptly');

const ApexClassMetadataType = 'ApexClass';

let login = function(options) {
    if(options.accessToken) {
        let connection = new jsforce.Connection({
            instanceUrl: options.instanceUrl,
            accessToken: options.accessToken
            });
        return Promise.resolve({connection, options});
    }

    let config = {
        loginUrl: options.loginUrl
    };
    if(options.version) {
        config.version = options.version;
    }
    if(options.logLevel) {
        config.logLevel = options.logLevel;
    }
    let connection = new jsforce.Connection(config);
    return connection
        .login(options.user, options.password + options.securityToken)
        .then(() => {
            console.log('Salesforce connection successful');
            return {connection, options};
        });
};

const buildRequest = apiVersion =>
    ({
        apiVersion,
        unpackaged: {
            types: [
                { name: ApexClassMetadataType, members: '*'}
            ]
        }
    });

const listApexClasses = state => state.connection.metadata
        .retrieve(buildRequest(state.connection.version))
            .complete({details:true})
        .then(metadataQueryResponse => Object.assign({}, state, {metadataQueryResponse}));

const findClassesNotInFolder = state => {
    let classesOnly = state.metadataQueryResponse.fileProperties
        .filter(el => el.type == ApexClassMetadataType);

    let serverFileStats = classesOnly
        .map(el =>
            new Promise(resolve =>
                fs.stat(state.options.classesFolder + '/' + el.fullName + '.cls')
                    .then(stat => resolve({stat, el}))
                    .catch(err => resolve({stat:false, el}))));

    return Promise
        .all(serverFileStats)
        .then(statAndElements => statAndElements
                                    .filter(el => !el.stat)
                                    .map(el => el.el))
        .then(extraClasses => {
            if(extraClasses.length === 0) {
                console.log('No extra classes found.');
            }
            return Object.assign({}, state, { extraClasses })
        });
};

const getExtraClasses = state => listApexClasses(state)
                                        .then(findClassesNotInFolder);

const outputHandlebars = function(state) {
    let classes = state.extraClasses.map(metaDataEntry => metaDataEntry.fullName);
    return fs.readFile(__dirname + '/destructive.hbs', 'utf-8')
        .then(fileContent => handlebars.compile(fileContent))
        .then(template => template({
            version: state.connection.version,
            extraClasses: classes
        }));
};

const toolingDeleteClassesOneByOne = state => {
    // due to error returned when trying to delete multiple classes
    //  >> UNKNOWN_EXCEPTION: admin operation already in progress
    // I have fallen back to deleting them one at a time
    let classes = state.extraClasses.map(el => ({id: el.id, fullName: el.fullName}));
    let processNext = (resolve, reject) => {
        if(classes.length == 0) {
            resolve();
            return;
        }
        let next = classes.pop();
        console.log('Removing ' + next.fullName);
        state.connection.tooling.delete('ApexClass', [next.id])
            .then(() => processNext(resolve, reject))
            .catch(e => reject(e));
    }

    let returnPromise = new Promise(processNext);
}

const toolingDeleteExtraClasses = state => {
    if(state.extraClasses.length) {
        console.log('Removing ' + state.extraClasses.length + ' classes');
        return toolingDeleteClassesOneByOne(state);
    }
};

const safetyPrompt = state => {
    if(state.options.noPrompt !== true && state.extraClasses.length) {
        const promptMessage = 'Permanently delete ' + state.extraClasses.length + ' classes? [y/n]';
        return promptly.prompt(promptMessage, { default: 'No' })
            .then(input => {
                if(input != 'y') {
                    console.log('Skipping delete!');
                    state.extraClasses = [];
                }
                return state;
            });
    }
    return state;
};

const generateXml = options =>
    login(options)
        .then(getExtraClasses)
        .then(outputHandlebars);

const deleteExtraApex = options =>
    login(options)
        .then(getExtraClasses)
        .then(safetyPrompt)
        .then(toolingDeleteExtraClasses);

module.exports = {
    generateXml,
    deleteExtraApex
};