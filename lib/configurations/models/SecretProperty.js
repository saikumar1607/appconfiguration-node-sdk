/**
 * Copyright 2022 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const { Logger } = require("../../core/Logger");
const { Constants } = require("../internal/Constants");

const logger = Logger.getInstance();

/**
 * Defines the SecretProperty model.
 */
class SecretProperty {
  constructor(propertyId) {
    this.propertyId = propertyId;
  }

  /**
   * Evaluate the value of the secret property.
   *
   * @param {*} entityId - Id of the Entity.
   * @param {*} entityAttributes - A JSON object consisting of the attribute name and their values that defines the specified entity.
   * 
   * @return {Promise|null} returns a Promise that either resolves with the response from the secret manager or rejects with an Error.
   * The resolved value is the actual secret value of the evaluated secret reference. The response contains the body, the headers, the status code, and the status text.
   * If using async/await, use try/catch for handling errors.
   */
  getCurrentValue(entityId, entityAttributes) {

    if (!entityId) {
      logger.error(`SecretProperty evaluation: ${Constants.INVALID_ENTITY_ID} getCurrentValue`);
      return null;
    }

    const { configurationHandler } = require('../ConfigurationHandler');
    const configurationHandlerInstance = configurationHandler.currentInstance();
    const propertyObj = configurationHandlerInstance.getProperty(this.propertyId);
    if (propertyObj.value !== undefined && Object.prototype.hasOwnProperty.call(propertyObj.value, 'secret_type')) {
      const secretType = propertyObj.value.secret_type;
      const propertyCurrentVal = propertyObj.getCurrentValue(entityId, entityAttributes);
      if (propertyCurrentVal !== null) {
        if (propertyCurrentVal.value !== undefined && Object.prototype.hasOwnProperty.call(propertyCurrentVal.value, 'id')) {
          const { id } = propertyCurrentVal.value;
          const secretMap = configurationHandlerInstance.getSecretsMap();
          const secretManagerObj = secretMap[this.propertyId];
          // Here we are not awaiting for the promise to resolve or not even catching the rejection. Instead, we are directly propogating the
          // returned promise from sm sdk to the output of getCurrentValue.
          return secretManagerObj.getSecret({
            secretType,
            id,
          })
        }
        logger.error(`SecretProperty Evaluation: Secret Id is missing from the Property : ${propertyObj.getPropertyName()}`);
        return null;
      }
      logger.error(`SecretProperty Evaluation: Property evaluated value is invalid.`);
      return null;
    }
    logger.error(`SecretProperty Evaluation: secret_type is missing from the Property value of : ${propertyObj.getPropertyName()}`);
    return null;
  }
}

module.exports = {
  SecretProperty,
};