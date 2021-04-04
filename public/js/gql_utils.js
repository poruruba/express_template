'use strict';

function gql_do_post(url, body, apikey) {
  const headers = new Headers({ "Content-Type": "application/json; charset=utf-8" });
  if( apikey )
    headers.append("x-api-key", apikey);

  var param = {
    method: 'POST',
    body: JSON.stringify(body),
    headers: headers,
  };

  return fetch(url, param)
  .then((response) => {
      if (!response.ok)
          throw 'status is not 200';
      return response.json();
  });
}

function gql_templ(strings, ...keys) {
  return (function(...values) {
      var result = [strings[0]];
      keys.forEach(function(key, i) {
          var value = values[key];
          result.push(value, strings[i + 1]);
      });
      return result.join('');
  });
}

function gql_escape(str){
  var t = JSON.stringify({ p: str });
  return t.slice(5, -1);
}

async function gql_query(url, templ, params, apikey){
  var body = {
    query: templ(...params)
  };
  var json = await gql_do_post(url, body, apikey );
  return json.data;
}

async function gql_mutation(url, templ, params){
  var body = {
      mutation: templ(...params)
  };
  var json = await gql_do_post(url, body );
  return json.data;
}
