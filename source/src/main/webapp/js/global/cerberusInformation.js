/*
 * Cerberus Copyright (C) 2013 - 2017 cerberustesting
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
 *
 * This file is part of Cerberus.
 *
 * Cerberus is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Cerberus is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Cerberus.  If not, see <http://www.gnu.org/licenses/>.
 */
/**
 * Load the CerberusInformation in sessionStorage
 * CerberusInformation contains various trace infrmation that are displayed 
 * inside the footer of every page.
 * Those are information such as the project name, its version or environment 
 * where it is executed.
 * @returns {void}
 */
function readCerberusInformation() {
    $.ajax({url: "ReadCerberusInformation",
        async: false,
        dataType: 'json',
        success: function (data) {
            var pi = data;
            sessionStorage.setItem("cerberusInformation", JSON.stringify(pi));
        }
    });
}
/**
 * Get the CerberusInformation from sessionStorage
 * @returns {JSONObject} cerberusInformation from sessionStorage
 */
function getCerberusInformation() {
    var pi;

//    if (sessionStorage.getItem("cerberusInformation") === null) {
    readCerberusInformation();
//    }
    pi = sessionStorage.getItem("cerberusInformation");
    pi = JSON.parse(pi);
    return pi;
}
